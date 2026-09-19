const mongoose = require('mongoose');

const warehouseStockSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, default: 0, min: 0 },
  aisle: { type: String, default: '' },
  bin: { type: String, default: '' },
}, { _id: false });

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, uppercase: true },
  barcode: { type: String, default: '' },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Electronics', 'Apparel', 'Home & Kitchen', 'Health & Beauty', 'Sports', 'Food & Beverage', 'Office Supplies', 'Automotive', 'Toys', 'Other'],
    default: 'Other'
  },
  brand: { type: String, default: '' },
  unit: { type: String, enum: ['piece', 'kg', 'liter', 'box', 'pack', 'set'], default: 'piece' },
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  minStockLevel: { type: Number, default: 10 },
  reorderPoint: { type: Number, default: 20 },
  reorderQuantity: { type: Number, default: 50 },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  warehouseStock: [warehouseStockSchema],
  totalStock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  soldQuantity: { type: Number, default: 0 },
  image: { type: String, default: '' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  weight: { type: Number, default: 0 },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
}, { timestamps: true });

productSchema.virtual('profitMargin').get(function () {
  if (!this.sellingPrice || !this.costPrice) return 0;
  return Math.round(((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100);
});

productSchema.virtual('stockStatus').get(function () {
  if (this.totalStock <= 0) return 'out_of_stock';
  if (this.totalStock <= this.minStockLevel) return 'low_stock';
  if (this.totalStock <= this.reorderPoint) return 'reorder_needed';
  return 'in_stock';
});

productSchema.pre('save', function (next) {
  if (this.warehouseStock && this.warehouseStock.length > 0) {
    this.totalStock = this.warehouseStock.reduce((sum, ws) => sum + (ws.quantity || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
