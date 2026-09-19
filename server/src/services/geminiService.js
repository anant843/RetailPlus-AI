const Product = require('../models/Product');
const Order = require('../models/Order');
const Supplier = require('../models/Supplier');

// ─── Gemini AI Service ───────────────────────────────────────────────────────

let genAI = null;

const initGemini = () => {
  if (process.env.GEMINI_API_KEY && !genAI) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      console.log('✅ Gemini AI initialized');
    } catch (e) {
      console.warn('⚠️  Gemini init failed:', e.message);
    }
  }
  return genAI;
};

// Build real-time inventory context snapshot for AI grounding
const buildInventoryContext = async () => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('supplier', 'name leadTimeDays rating')
      .lean();

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const lowStockItems = products.filter(p => p.totalStock <= p.reorderPoint);
    const outOfStock = products.filter(p => p.totalStock === 0);

    const totalInventoryValue = products.reduce((sum, p) => sum + (p.totalStock * p.costPrice), 0);
    const salesOrders = recentOrders.filter(o => o.orderType === 'sales');
    const totalRevenue = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const topProducts = [...products]
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 5)
      .map(p => ({ name: p.name, sku: p.sku, sold: p.soldQuantity, stock: p.totalStock }));

    const context = `
RETAILPULSE AI - LIVE INVENTORY SNAPSHOT (${new Date().toISOString()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVENTORY OVERVIEW:
- Total Active Products: ${products.length}
- Total Inventory Value: $${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Low Stock Items: ${lowStockItems.length}
- Out of Stock Items: ${outOfStock.length}
- Recent Orders (last 20): ${recentOrders.length}
- Recent Sales Revenue: $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}

LOW STOCK ALERTS:
${lowStockItems.length > 0 
  ? lowStockItems.slice(0, 10).map(p => 
    `- ${p.name} (SKU: ${p.sku}): ${p.totalStock} units left, reorder at ${p.reorderPoint}, min: ${p.minStockLevel}`
  ).join('\n')
  : '- No low stock items currently'}

OUT OF STOCK:
${outOfStock.length > 0
  ? outOfStock.map(p => `- ${p.name} (SKU: ${p.sku})`).join('\n')
  : '- No out-of-stock items currently'}

TOP SELLING PRODUCTS:
${topProducts.map((p, i) => `${i+1}. ${p.name} (SKU: ${p.sku}) - Sold: ${p.sold}, Stock: ${p.stock}`).join('\n')}

PRODUCT INVENTORY DETAILS:
${products.slice(0, 15).map(p => 
  `- ${p.name} | SKU: ${p.sku} | Stock: ${p.totalStock} | Reorder: ${p.reorderPoint} | Category: ${p.category} | Price: $${p.sellingPrice} | Supplier: ${p.supplier?.name || 'N/A'} | Lead Time: ${p.supplier?.leadTimeDays || '?'} days`
).join('\n')}

RECENT ORDERS:
${recentOrders.slice(0, 8).map(o => 
  `- ${o.orderNumber} | ${o.orderType.toUpperCase()} | $${o.totalAmount.toFixed(2)} | Status: ${o.status} | ${new Date(o.createdAt).toLocaleDateString()}`
).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return { context, products, lowStockItems, outOfStock, topProducts, totalInventoryValue };
  } catch (err) {
    console.error('Context build error:', err.message);
    return { context: 'Inventory data temporarily unavailable.', products: [], lowStockItems: [], outOfStock: [], topProducts: [], totalInventoryValue: 0 };
  }
};

// ─── Chat with Inventory Copilot ─────────────────────────────────────────────
const chatWithAI = async (message, conversationHistory = []) => {
  const { context, products, lowStockItems } = await buildInventoryContext();

  const ai = initGemini();

  if (ai) {
    try {
      const model = ai.models;
      const systemPrompt = `You are RetailPulse AI, an expert inventory management assistant. You have real-time access to the warehouse inventory system. Answer questions accurately based on the inventory data provided. Be concise, professional, and actionable. Format numbers clearly with units.

${context}`;

      const historyText = conversationHistory.slice(-6).map(h => 
        `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`
      ).join('\n');

      const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser: ${message}\n\nAssistant:`;

      const response = await model.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
      });

      return response.text;
    } catch (err) {
      console.warn('Gemini API error, using fallback:', err.message);
    }
  }

  // ─── Deterministic Fallback Engine ──────────────────────────────────────────
  return generateFallbackResponse(message, { products, lowStockItems, context });
};

const generateFallbackResponse = (message, { products, lowStockItems }) => {
  const msg = message.toLowerCase();

  if (msg.includes('low stock') || msg.includes('running out') || msg.includes('reorder')) {
    if (lowStockItems.length === 0) {
      return '✅ **Great news!** All inventory levels are healthy. No items are currently below reorder points.';
    }
    const topLow = lowStockItems.slice(0, 5);
    return `⚠️ **${lowStockItems.length} items need attention:**\n\n${topLow.map(p => 
      `• **${p.name}** (${p.sku})\n  Current: ${p.totalStock} units | Reorder at: ${p.reorderPoint} | Min: ${p.minStockLevel}`
    ).join('\n\n')}\n\n${lowStockItems.length > 5 ? `...and ${lowStockItems.length - 5} more items.` : ''}\n\n💡 **Recommendation:** Create purchase orders for these SKUs immediately to avoid stockouts.`;
  }

  if (msg.includes('out of stock') || msg.includes('stockout')) {
    const outOfStock = products.filter(p => p.totalStock === 0);
    if (outOfStock.length === 0) {
      return '✅ **No stockouts detected.** All products currently have available inventory.';
    }
    return `🚨 **${outOfStock.length} products are out of stock:**\n\n${outOfStock.map(p => `• **${p.name}** (${p.sku})`).join('\n')}\n\n⚡ **Urgent Action Required:** Contact suppliers immediately for expedited restocking.`;
  }

  if (msg.includes('top') || msg.includes('best') || msg.includes('selling')) {
    const top = [...products].sort((a, b) => b.soldQuantity - a.soldQuantity).slice(0, 5);
    return `🏆 **Top 5 Best-Selling Products:**\n\n${top.map((p, i) => 
      `${i+1}. **${p.name}** (${p.sku})\n   Sold: ${p.soldQuantity} units | Current Stock: ${p.totalStock} | Revenue: $${(p.soldQuantity * p.sellingPrice).toLocaleString()}`
    ).join('\n\n')}`;
  }

  if (msg.includes('inventory value') || msg.includes('total value') || msg.includes('worth')) {
    const total = products.reduce((sum, p) => sum + (p.totalStock * p.costPrice), 0);
    const retail = products.reduce((sum, p) => sum + (p.totalStock * p.sellingPrice), 0);
    return `💰 **Inventory Valuation:**\n\n• **Cost Value:** $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Retail Value:** $${retail.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Potential Profit:** $${(retail - total).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Total SKUs:** ${products.length}`;
  }

  if (msg.includes('category') || msg.includes('categories')) {
    const cats = {};
    products.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + p.totalStock;
    });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return `📦 **Inventory by Category:**\n\n${sorted.map(([cat, qty]) => `• **${cat}:** ${qty.toLocaleString()} units`).join('\n')}`;
  }

  if (msg.includes('restock') || msg.includes('recommend') || msg.includes('suggestion')) {
    const urgent = lowStockItems.slice(0, 3);
    return `🤖 **AI Restocking Recommendations:**\n\n${urgent.length > 0 
      ? urgent.map(p => {
          const qty = Math.max(p.reorderQuantity || 50, (p.reorderPoint - p.totalStock) * 2);
          return `• **${p.name}** — Order **${qty} units**\n  Current: ${p.totalStock} | Safety stock needed: ${p.reorderPoint}`;
        }).join('\n\n')
      : 'All products are adequately stocked. No immediate restocking needed.'
    }\n\n💡 Navigate to **AI → Smart Restock** for full recommendations with cost estimates.`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help')) {
    return `👋 **Hello! I'm RetailPulse AI, your inventory copilot.**\n\nI have live access to your warehouse data. Here's what I can help with:\n\n• 📦 **Stock levels** — "What items are low on stock?"\n• 🏆 **Performance** — "What are our best sellers?"\n• 💰 **Valuation** — "What is our inventory worth?"\n• 🔄 **Restocking** — "What should we reorder?"\n• ⚠️ **Alerts** — "Are there any stockouts?"\n• 📊 **Category insights** — "Show inventory by category"\n\nHow can I help you today?`;
  }

  // Default response
  return `I processed your query about: "${message}"\n\n📊 **Quick Inventory Summary:**\n• Total Products: ${products.length}\n• Items needing reorder: ${lowStockItems.length}\n• Total inventory value: $${products.reduce((s, p) => s + p.totalStock * p.costPrice, 0).toLocaleString()}\n\n💡 Try asking about:\n• "Which items are low on stock?"\n• "What are our top selling products?"\n• "What is our total inventory value?"\n• "What should we restock?"`;
};

// ─── Demand Forecasting ───────────────────────────────────────────────────────
const generateDemandForecast = async (productId, days = 30) => {
  const product = await Product.findById(productId).populate('supplier');

  if (!product) throw new Error('Product not found');

  // Simulate historical data and forecast
  const historicalData = generateHistoricalSales(product);
  const forecast = generateForecastData(historicalData, days, product);

  const ai = initGemini();
  let aiInsight = '';

  if (ai) {
    try {
      const prompt = `Analyze demand for: ${product.name} (${product.category})
Current stock: ${product.totalStock}, Avg daily sales: ${(product.soldQuantity / 90).toFixed(1)} units/day
Provide 2-3 sentences of demand insight and recommendation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });
      aiInsight = response.text;
    } catch (e) {
      aiInsight = generateDefaultInsight(product);
    }
  } else {
    aiInsight = generateDefaultInsight(product);
  }

  return {
    product: {
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      currentStock: product.totalStock,
      reorderPoint: product.reorderPoint,
    },
    historicalData,
    forecast,
    aiInsight,
    daysOfStockLeft: product.soldQuantity > 0
      ? Math.round(product.totalStock / (product.soldQuantity / 90))
      : 999,
  };
};

const generateHistoricalSales = (product) => {
  const data = [];
  const baseRate = product.soldQuantity > 0 ? product.soldQuantity / 90 : 5;
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;
    const variance = 0.7 + Math.random() * 0.6;
    const sales = Math.round(baseRate * weekendMultiplier * variance);
    data.push({
      date: date.toISOString().split('T')[0],
      sales,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return data;
};

const generateForecastData = (historical, days, product) => {
  const avgSales = historical.reduce((s, d) => s + d.sales, 0) / historical.length;
  const trend = (historical[historical.length - 1].sales - historical[0].sales) / historical.length * 0.1;
  const forecast = [];
  const now = new Date();

  for (let i = 1; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1;
    const predictedSales = Math.max(0, Math.round((avgSales + trend * i) * weekendMultiplier));
    forecast.push({
      date: date.toISOString().split('T')[0],
      predicted: predictedSales,
      lower: Math.max(0, Math.round(predictedSales * 0.75)),
      upper: Math.round(predictedSales * 1.25),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return forecast;
};

const generateDefaultInsight = (product) => {
  const dailyRate = (product.soldQuantity / 90).toFixed(1);
  const daysLeft = product.soldQuantity > 0
    ? Math.round(product.totalStock / (product.soldQuantity / 90))
    : 999;

  if (daysLeft < 7) {
    return `⚠️ **Critical:** At the current sell rate of ${dailyRate} units/day, ${product.name} will run out in approximately ${daysLeft} days. Immediate restocking is recommended.`;
  } else if (daysLeft < 30) {
    return `📊 ${product.name} has approximately ${daysLeft} days of stock remaining at ${dailyRate} units/day average sales rate. Place a purchase order within the next week to maintain healthy inventory levels.`;
  }
  return `✅ ${product.name} has healthy inventory with approximately ${daysLeft} days of stock at ${dailyRate} units/day. Monitor trends and reorder when reaching the reorder point of ${product.reorderPoint} units.`;
};

// ─── Smart Restocking Recommendations ────────────────────────────────────────
const generateRestockRecommendations = async () => {
  const products = await Product.find({ isActive: true }).populate('supplier', 'name leadTimeDays rating paymentTerms');

  const recommendations = [];

  for (const product of products) {
    const dailySales = product.soldQuantity > 0 ? product.soldQuantity / 90 : 2;
    const leadTimeDays = product.supplier?.leadTimeDays || 7;
    const safetyStock = Math.ceil(dailySales * leadTimeDays * 1.5);
    const eoq = Math.ceil(Math.sqrt((2 * dailySales * 365 * (product.costPrice * 0.2)) / (product.costPrice * 0.25)) * 10);
    const reorderQty = Math.max(product.reorderQuantity || 50, eoq);
    const urgency = product.totalStock <= product.minStockLevel ? 'critical'
      : product.totalStock <= product.reorderPoint ? 'high'
      : product.totalStock <= product.reorderPoint * 1.5 ? 'medium'
      : 'low';

    if (urgency !== 'low') {
      recommendations.push({
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          image: product.image,
        },
        currentStock: product.totalStock,
        reorderPoint: product.reorderPoint,
        minStock: product.minStockLevel,
        dailySales: Math.round(dailySales * 10) / 10,
        safetyStock,
        recommendedQty: reorderQty,
        estimatedCost: reorderQty * product.costPrice,
        daysOfStockLeft: Math.round(product.totalStock / Math.max(dailySales, 0.1)),
        urgency,
        supplier: product.supplier ? {
          name: product.supplier.name,
          leadTimeDays: product.supplier.leadTimeDays,
          rating: product.supplier.rating,
        } : null,
      });
    }
  }

  return recommendations.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.urgency] - order[b.urgency];
  });
};

module.exports = {
  chatWithAI,
  generateDemandForecast,
  generateRestockRecommendations,
  buildInventoryContext,
};
