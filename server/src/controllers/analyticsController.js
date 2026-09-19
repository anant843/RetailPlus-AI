const Product = require('../models/Product');
const Order = require('../models/Order');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');

// @desc    Get dashboard KPIs and analytics
// @route   GET /api/analytics/dashboard
const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Products
    const products = await Product.find({ isActive: true }).lean();
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((s, p) => s + (p.totalStock * p.costPrice), 0);
    const totalRetailValue = products.reduce((s, p) => s + (p.totalStock * p.sellingPrice), 0);
    const lowStockCount = products.filter(p => p.totalStock <= p.reorderPoint && p.totalStock > 0).length;
    const outOfStockCount = products.filter(p => p.totalStock === 0).length;

    // Orders this month
    const monthlyOrders = await Order.find({ createdAt: { $gte: startOfMonth } }).lean();
    const lastMonthOrders = await Order.find({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).lean();

    const monthlyRevenue = monthlyOrders.filter(o => o.orderType === 'sales').reduce((s, o) => s + o.totalAmount, 0);
    const lastMonthRevenue = lastMonthOrders.filter(o => o.orderType === 'sales').reduce((s, o) => s + o.totalAmount, 0);
    const monthlyPurchases = monthlyOrders.filter(o => o.orderType === 'purchase').reduce((s, o) => s + o.totalAmount, 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;

    const grossProfit = monthlyRevenue - monthlyPurchases;
    const grossMargin = monthlyRevenue > 0 ? ((grossProfit / monthlyRevenue) * 100).toFixed(1) : 0;

    // Warehouses
    const warehouses = await Warehouse.find({ isActive: true }).lean();

    // Category distribution
    const categoryMap = {};
    products.forEach(p => {
      if (!categoryMap[p.category]) categoryMap[p.category] = { count: 0, value: 0, stock: 0 };
      categoryMap[p.category].count++;
      categoryMap[p.category].value += p.totalStock * p.costPrice;
      categoryMap[p.category].stock += p.totalStock;
    });
    const categoryDistribution = Object.entries(categoryMap).map(([name, data]) => ({
      name, ...data
    })).sort((a, b) => b.value - a.value);

    // Monthly revenue chart (last 6 months)
    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthOrders = await Order.find({ createdAt: { $gte: start, $lte: end } }).lean();
      const revenue = monthOrders.filter(o => o.orderType === 'sales').reduce((s, o) => s + o.totalAmount, 0);
      const purchases = monthOrders.filter(o => o.orderType === 'purchase').reduce((s, o) => s + o.totalAmount, 0);
      monthlyChart.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Math.round(revenue),
        purchases: Math.round(purchases),
        profit: Math.round(revenue - purchases),
      });
    }

    // Top products by sold quantity
    const topProducts = [...products]
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
        sku: p.sku,
        sold: p.soldQuantity,
        stock: p.totalStock,
        revenue: Math.round(p.soldQuantity * p.sellingPrice),
      }));

    // Recent stock movements
    const recentMovements = await StockMovement.find()
      .sort({ createdAt: -1 }).limit(8)
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .lean();

    // Pending orders
    const pendingOrders = await Order.find({ status: { $in: ['pending', 'processing'] } })
      .sort({ createdAt: -1 }).limit(5)
      .lean();

    res.json({
      success: true,
      kpis: {
        totalProducts,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
        revenueGrowth: Number(revenueGrowth),
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMargin: Number(grossMargin),
        totalWarehouses: warehouses.length,
        monthlyPurchases: Math.round(monthlyPurchases * 100) / 100,
        totalOrders: monthlyOrders.length,
      },
      categoryDistribution,
      monthlyChart,
      topProducts,
      recentMovements,
      pendingOrders,
      warehouses: warehouses.map(w => ({
        id: w._id, name: w.name, code: w.code,
        capacity: w.capacity, currentUtilization: w.currentUtilization,
        city: w.city, type: w.type,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get stock movement history
// @route   GET /api/analytics/movements
const getStockMovements = async (req, res) => {
  try {
    const { type, product, warehouse, page = 1, limit = 30 } = req.query;
    const query = {};
    if (type) query.movementType = type;
    if (product) query.product = product;
    if (warehouse) query.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('product', 'name sku category')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: movements.length, total, movements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get notifications
// @route   GET /api/analytics/notifications
const getNotifications = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    // Auto-generate notifications from low stock
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderPoint'] }
    }).limit(10).lean();

    // Return synthetic notifications based on current state
    const notifications = [
      ...products.map(p => ({
        _id: p._id,
        title: p.totalStock === 0 ? '🚨 Out of Stock' : '⚠️ Low Stock Alert',
        message: `${p.name} (${p.sku}): ${p.totalStock} units remaining`,
        type: p.totalStock === 0 ? 'out_of_stock' : 'low_stock',
        priority: p.totalStock === 0 ? 'critical' : 'high',
        isRead: false,
        createdAt: new Date(),
      }))
    ];

    const dbNotifications = await require('../models/Notification').find()
      .sort({ createdAt: -1 }).limit(20);

    res.json({ success: true, notifications: [...notifications, ...dbNotifications] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardAnalytics, getStockMovements, getNotifications };
