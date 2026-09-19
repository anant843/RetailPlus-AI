const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockProducts, adjustStock } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/low-stock', protect, getLowStockProducts);
router.route('/').get(protect, getProducts).post(protect, authorize('admin', 'manager'), createProduct);
router.route('/:id').get(protect, getProduct).put(protect, authorize('admin', 'manager'), updateProduct).delete(protect, authorize('admin'), deleteProduct);
router.post('/:id/adjust-stock', protect, authorize('admin', 'manager'), adjustStock);

module.exports = router;
