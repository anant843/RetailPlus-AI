const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Notification = require('../models/Notification');

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, status, warehouse, supplier, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') query.category = category;
    if (supplier) query.supplier = supplier;
    if (status === 'low_stock') query.$where = 'this.totalStock <= this.reorderPoint && this.totalStock > 0';
    if (status === 'out_of_stock') query.totalStock = 0;
    if (status === 'in_stock') query.$expr = { $gt: ['$totalStock', '$reorderPoint'] };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('supplier', 'name code leadTimeDays rating')
      .populate('warehouseStock.warehouse', 'name code')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: products.length, total, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name code leadTimeDays rating paymentTerms email phone')
      .populate('warehouseStock.warehouse', 'name code city');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.supplier || (typeof data.supplier === 'string' && data.supplier.trim() === '')) {
      delete data.supplier;
    }
    if (data.warehouseStock && Array.isArray(data.warehouseStock)) {
      data.warehouseStock = data.warehouseStock.filter(ws => ws.warehouse && ws.warehouse.toString().trim() !== '');
      data.totalStock = data.warehouseStock.reduce((sum, ws) => sum + (Number(ws.quantity) || 0), 0);
    } else {
      data.totalStock = 0;
    }
    const product = await Product.create(data);
    await product.populate([
      { path: 'supplier', select: 'name code' },
      { path: 'warehouseStock.warehouse', select: 'name code' }
    ]);
    console.log(`✅ Product created in DB: ${product.sku} - ${product.name}`);
    res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.supplier || (typeof data.supplier === 'string' && data.supplier.trim() === '')) {
      data.supplier = null;
    }
    if (data.warehouseStock && Array.isArray(data.warehouseStock)) {
      data.warehouseStock = data.warehouseStock.filter(ws => ws.warehouse && ws.warehouse.toString().trim() !== '');
      data.totalStock = data.warehouseStock.reduce((sum, ws) => sum + (Number(ws.quantity) || 0), 0);
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    ).populate('supplier', 'name code leadTimeDays');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete product (permanent delete from database)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    console.log(`🗑️ Product permanently deleted from DB: ${product.sku} - ${product.name}`);
    res.json({ success: true, message: 'Product permanently deleted from database', id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderPoint'] }
    }).populate('supplier', 'name leadTimeDays').sort({ totalStock: 1 });

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Adjust stock in a warehouse
// @route   POST /api/products/:id/adjust-stock
const adjustStock = async (req, res) => {
  try {
    const { warehouseId, quantity, reason, type } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const wsIndex = product.warehouseStock.findIndex(
      ws => ws.warehouse.toString() === warehouseId
    );

    const before = wsIndex >= 0 ? product.warehouseStock[wsIndex].quantity : 0;

    if (wsIndex >= 0) {
      product.warehouseStock[wsIndex].quantity += quantity;
    } else {
      product.warehouseStock.push({ warehouse: warehouseId, quantity: Math.max(0, quantity) });
    }

    product.totalStock = product.warehouseStock.reduce((sum, ws) => sum + ws.quantity, 0);
    await product.save();

    // Log movement
    await StockMovement.create({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      movementType: type || 'adjustment',
      toWarehouse: warehouseId,
      quantity: Math.abs(quantity),
      quantityBefore: before,
      quantityAfter: before + quantity,
      reason,
      performedBy: req.user._id,
      performedByName: req.user.name,
    });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockProducts, adjustStock };
