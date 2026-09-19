const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'USA' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  capacity: { type: Number, default: 10000 },
  currentUtilization: { type: Number, default: 0 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['main', 'distribution', 'retail', 'cold_storage'], default: 'main' },
}, { timestamps: true });

warehouseSchema.virtual('utilizationPercent').get(function () {
  if (!this.capacity) return 0;
  return Math.round((this.currentUtilization / this.capacity) * 100);
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
