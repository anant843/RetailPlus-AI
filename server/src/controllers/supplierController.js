const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getSuppliers = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } },
    ];
    if (category) query.categories = category;

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const products = await Product.find({ supplier: req.params.id, isActive: true })
      .select('name sku totalStock costPrice sellingPrice category');

    const recentOrders = await Order.find({ supplier: req.params.id })
      .sort({ createdAt: -1 }).limit(10).select('orderNumber totalAmount status createdAt');

    res.json({ success: true, supplier, products, recentOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Supplier code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier permanently deleted from database' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
