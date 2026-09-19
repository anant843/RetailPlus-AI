const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true })
      .populate('manager', 'name email');
    res.json({ success: true, count: warehouses.length, warehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'name email');
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    // Get products in this warehouse
    const products = await Product.find({
      isActive: true,
      'warehouseStock.warehouse': req.params.id,
      'warehouseStock.quantity': { $gt: 0 }
    }).select('name sku category totalStock warehouseStock costPrice');

    const inventoryItems = products.map(p => {
      const ws = p.warehouseStock.find(w => w.warehouse.toString() === req.params.id);
      return {
        product: { id: p._id, name: p.name, sku: p.sku, category: p.category },
        quantity: ws ? ws.quantity : 0,
        aisle: ws ? ws.aisle : '',
        bin: ws ? ws.bin : '',
        value: ws ? ws.quantity * p.costPrice : 0,
      };
    });

    res.json({ success: true, warehouse, inventory: inventoryItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, warehouse });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Warehouse code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, message: 'Warehouse permanently deleted from database' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Transfer stock between warehouses
const transferStock = async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = req.body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ success: false, message: 'Source and destination cannot be the same' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const fromWH = await Warehouse.findById(fromWarehouseId);
    const toWH = await Warehouse.findById(toWarehouseId);

    if (!fromWH || !toWH) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    const fromIdx = product.warehouseStock.findIndex(ws => ws.warehouse.toString() === fromWarehouseId);
    if (fromIdx < 0 || product.warehouseStock[fromIdx].quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock in source warehouse' });
    }

    const fromBefore = product.warehouseStock[fromIdx].quantity;
    product.warehouseStock[fromIdx].quantity -= quantity;

    const toIdx = product.warehouseStock.findIndex(ws => ws.warehouse.toString() === toWarehouseId);
    if (toIdx >= 0) {
      product.warehouseStock[toIdx].quantity += quantity;
    } else {
      product.warehouseStock.push({ warehouse: toWarehouseId, quantity });
    }

    await product.save();

    // Log movement
    await StockMovement.create({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      movementType: 'transfer',
      fromWarehouse: fromWarehouseId,
      fromWarehouseName: fromWH.name,
      toWarehouse: toWarehouseId,
      toWarehouseName: toWH.name,
      quantity,
      quantityBefore: fromBefore,
      quantityAfter: fromBefore - quantity,
      reason: reason || 'Stock transfer',
      performedBy: req.user._id,
      performedByName: req.user.name,
    });

    res.json({ success: true, message: `Successfully transferred ${quantity} units`, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse, transferStock };
