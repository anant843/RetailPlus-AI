const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: 'USA' },
  website: { type: String, default: '' },
  taxId: { type: String, default: '' },
  leadTimeDays: { type: Number, default: 7 },
  rating: { type: Number, min: 0, max: 5, default: 3.5 },
  paymentTerms: { type: String, enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cod'], default: 'net_30' },
  categories: [{ type: String }],
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
