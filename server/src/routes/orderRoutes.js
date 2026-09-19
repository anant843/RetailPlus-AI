const express = require('express');
const router = express.Router();
const { getOrders, getOrder, createOrder, updateOrderStatus, deleteOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(protect, getOrders).post(protect, authorize('admin', 'manager'), createOrder);
router.route('/:id').get(protect, getOrder).delete(protect, authorize('admin'), deleteOrder);
router.put('/:id/status', protect, authorize('admin', 'manager'), updateOrderStatus);

module.exports = router;
