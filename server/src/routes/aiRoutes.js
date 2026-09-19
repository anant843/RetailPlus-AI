const express = require('express');
const router = express.Router();
const { chat, getDemandForecast, getRestockRecommendations } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, chat);
router.get('/forecast/:productId', protect, getDemandForecast);
router.get('/restock', protect, getRestockRecommendations);

module.exports = router;
