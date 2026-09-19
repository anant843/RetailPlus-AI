const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  movementType: {
    type: String,
    enum: ['receive', 'dispatch', 'transfer', 'adjustment', 'return'],
    required: true
  },
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  fromWarehouseName: { type: String, default: '' },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouseName: { type: String, default: '' },
  quantity: { type: Number, required: true },
  quantityBefore: { type: Number, default: 0 },
  quantityAfter: { type: Number, default: 0 },
  reason: { type: String, default: '' },
  reference: { type: String, default: '' }, // Order number or transfer ID
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
