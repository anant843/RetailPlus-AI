const { chatWithAI, generateDemandForecast, generateRestockRecommendations } = require('../services/geminiService');

// @desc    Chat with AI Inventory Copilot
// @route   POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const response = await chatWithAI(message.trim(), history);
    res.json({ success: true, response, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get demand forecast for a product
// @route   GET /api/ai/forecast/:productId
const getDemandForecast = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const forecast = await generateDemandForecast(req.params.productId, days);
    res.json({ success: true, ...forecast });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get smart restocking recommendations
// @route   GET /api/ai/restock
const getRestockRecommendations = async (req, res) => {
  try {
    const recommendations = await generateRestockRecommendations();
    const totalCost = recommendations.reduce((s, r) => s + r.estimatedCost, 0);
    res.json({ success: true, count: recommendations.length, totalCost, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { chat, getDemandForecast, getRestockRecommendations };
