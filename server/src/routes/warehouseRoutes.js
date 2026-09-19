const express = require('express');
const router = express.Router();
const { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse, transferStock } = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/auth');

router.post('/transfer', protect, authorize('admin', 'manager'), transferStock);
router.route('/').get(protect, getWarehouses).post(protect, authorize('admin'), createWarehouse);
router.route('/:id').get(protect, getWarehouse).put(protect, authorize('admin', 'manager'), updateWarehouse).delete(protect, authorize('admin'), deleteWarehouse);

module.exports = router;
