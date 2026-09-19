const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getStockMovements, getNotifications } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/movements', protect, getStockMovements);
router.get('/notifications', protect, getNotifications);

module.exports = router;
