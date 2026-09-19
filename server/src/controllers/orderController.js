const Order = require('../models/Order');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');

const getOrders = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.orderType = type;
    if (status) query.status = status;
    if (search) query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
    ];

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('supplier', 'name code')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: orders.length, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('supplier', 'name code email phone')
      .populate('warehouse', 'name code city')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku category');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { orderType, supplier, customerName, customerEmail, customerPhone,
      warehouse, items, taxRate, discountAmount, notes, expectedDate, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    // Validate and enrich items
    const enrichedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.product} not found` });

      // For sales orders, check stock
      if (orderType === 'sales' && product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}`
        });
      }

      const unitPrice = item.unitPrice || (orderType === 'purchase' ? product.costPrice : product.sellingPrice);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      enrichedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    const tax = taxRate || 0.1;
    const taxAmount = subtotal * tax;
    const discount = discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discount;

    const warehouseDoc = await Warehouse.findById(warehouse);

    const order = await Order.create({
      orderType, supplier, supplierName: '',
      customerName, customerEmail, customerPhone,
      warehouse, warehouseName: warehouseDoc?.name || '',
      items: enrichedItems, subtotal, taxRate: tax, taxAmount,
      discountAmount: discount, totalAmount, notes, expectedDate,
      paymentMethod, createdBy: req.user._id,
    });

    // If supplier, populate supplier name
    if (supplier) {
      const sup = await Supplier.findById(supplier);
      if (sup) { order.supplierName = sup.name; await order.save(); }
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = order.status;
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedBy = req.user._id;

    // Inventory adjustments on status change
    if (status === 'delivered' && previousStatus !== 'delivered') {
      for (const item of order.items) {
        const product = await Product.findById(item.product._id || item.product);
        if (!product) continue;

        if (order.orderType === 'purchase') {
          // Add stock to warehouse
          const wsIdx = product.warehouseStock.findIndex(
            ws => ws.warehouse.toString() === order.warehouse.toString()
          );
          if (wsIdx >= 0) {
            product.warehouseStock[wsIdx].quantity += item.quantity;
          } else {
            product.warehouseStock.push({ warehouse: order.warehouse, quantity: item.quantity });
          }
          product.totalStock = product.warehouseStock.reduce((s, ws) => s + ws.quantity, 0);
          await product.save();

          await StockMovement.create({
            product: product._id, productName: product.name, sku: product.sku,
            movementType: 'receive', toWarehouse: order.warehouse,
            quantity: item.quantity, reason: `Purchase Order ${order.orderNumber} delivered`,
            reference: order.orderNumber, order: order._id,
            performedBy: req.user._id, performedByName: req.user.name,
          });

        } else if (order.orderType === 'sales') {
          // Remove stock from warehouse
          const wsIdx = product.warehouseStock.findIndex(
            ws => ws.warehouse.toString() === order.warehouse.toString()
          );
          if (wsIdx >= 0) {
            product.warehouseStock[wsIdx].quantity = Math.max(0, product.warehouseStock[wsIdx].quantity - item.quantity);
          }
          product.totalStock = product.warehouseStock.reduce((s, ws) => s + ws.quantity, 0);
          product.soldQuantity = (product.soldQuantity || 0) + item.quantity;
          await product.save();

          await StockMovement.create({
            product: product._id, productName: product.name, sku: product.sku,
            movementType: 'dispatch', fromWarehouse: order.warehouse,
            quantity: item.quantity, reason: `Sales Order ${order.orderNumber} delivered`,
            reference: order.orderNumber, order: order._id,
            performedBy: req.user._id, performedByName: req.user.name,
          });
        }
      }

      order.deliveredDate = new Date();

      // Update supplier stats for purchase orders
      if (order.orderType === 'purchase' && order.supplier) {
        await Supplier.findByIdAndUpdate(order.supplier, {
          $inc: { totalOrders: 1, totalSpent: order.totalAmount }
        });
      }
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot delete delivered orders' });
    }
    await Order.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrderStatus, deleteOrder };
