const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  orderType: { type: String, enum: ['purchase', 'sales'], required: true },
  // For purchase orders
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String, default: '' },
  // For sales orders
  customerName: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  // Common fields
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  warehouseName: { type: String, default: '' },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0.1 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['bank_transfer', 'credit_card', 'cash', 'check', 'other'], default: 'bank_transfer' },
  notes: { type: String, default: '' },
  expectedDate: { type: Date },
  deliveredDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const prefix = this.orderType === 'purchase' ? 'PO' : 'SO';
    const count = await mongoose.model('Order').countDocuments({ orderType: this.orderType });
    this.orderNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
