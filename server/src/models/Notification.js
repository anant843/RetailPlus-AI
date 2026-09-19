const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['low_stock', 'out_of_stock', 'reorder_needed', 'order_status', 'transfer', 'system', 'alert'],
    default: 'system'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isRead: { type: Boolean, default: false },
  relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  relatedWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  forRole: { type: String, enum: ['all', 'admin', 'manager', 'staff'], default: 'all' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
