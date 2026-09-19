import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, fetchForecast, fetchRestockRecommendations, addUserMessage, clearChat } from '../app/slices/aiSlice';
import { fetchProducts } from '../app/slices/productSlice';
import {
  Bot, Send, RefreshCw, TrendingUp, Package, AlertTriangle,
  MessageSquare, BarChart3, X, Sparkles, Shield, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

const SUGGESTION_PROMPTS = [
  'Which items are currently below safety stock?',
  'List top revenue-generating SKUs this month',
  'What is our total active stock valuation across hubs?',
  'Recommend urgent supplier replenishment orders',
  'Are there any out-of-stock items needing immediate action?',
  'Summarize inventory distribution by product category',
];

const URGENCY_COLORS = {
  critical: { badge: 'badge-danger', text: 'text-rose-400' },
  high: { badge: 'badge-warning', text: 'text-amber-400' },
  medium: { badge: 'badge-info', text: 'text-blue-400' },
  low: { badge: 'badge-success', text: 'text-emerald-400' },
};

const MarkdownMessage = ({ content }) => {
  const formatMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#11221A] px-1.5 py-0.5 rounded font-mono text-[11px] text-emerald-300 border border-[#1A402E]">$1</code>')
      .replace(/•\s/g, '• ')
      .replace(/\n/g, '<br />');
  };

  return <div className="text-xs leading-relaxed text-gray-200" dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />;
};

const AIAssistant = () => {
  const dispatch = useDispatch();
  const { chatHistory = [], forecast, restockRecommendations = [], restockTotal = 0, chatLoading, forecastLoading, restockLoading } = useSelector((s) => s.ai || {});
  const { items: products = [] } = useSelector((s) => s.products || {});

  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecastDays, setForecastDays] = useState(30);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    if (activeTab === 'restock' && (!restockRecommendations || restockRecommendations.length === 0)) {
      dispatch(fetchRestockRecommendations());
    }
  }, [activeTab]);

  const handleSend = async () => {
    if (!message.trim() || chatLoading) return;
    const msg = message.trim();
    setMessage('');
    dispatch(addUserMessage(msg));
    await dispatch(sendChatMessage({ message: msg, history: chatHistory }));
  };

  const handleSuggestion = async (text) => {
    dispatch(addUserMessage(text));
    await dispatch(sendChatMessage({ message: text, history: chatHistory }));
  };

  const handleForecast = () => {
    if (selectedProduct) dispatch(fetchForecast({ productId: selectedProduct, days: forecastDays }));
  };

  const tabs = [
    { id: 'chat', label: 'Operations Copilot', icon: Bot },
    { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp },
    { id: 'restock', label: 'Replenishment Requisitions', icon: Package },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Demand Forecasting & Replenishment Planning</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#11221A] text-emerald-300 border border-[#1A402E]">
              AI FORECASTING · ACTIVE LEDGER
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Inventory ledger queries, historical demand projections, and safety stock reorder recommendations
          </p>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="inline-flex p-0.5 bg-[#0E1015] border border-[#232834] rounded-md text-xs font-mono">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === id
                ? 'bg-[#1A1E29] text-white font-semibold border border-[#2B3242]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Chat Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="saas-card flex flex-col" style={{ height: 'calc(100vh - 270px)', minHeight: '480px' }}>
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E232E] bg-[#0E1015]">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">Operations Copilot</span>
              <span className="text-[10px] font-mono text-gray-500">· Active inventory records connected</span>
            </div>
            <button
              onClick={() => dispatch(clearChat())}
              className="text-[11px] font-mono text-gray-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear History
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!chatHistory || chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-5 text-center p-4">
                <div className="w-10 h-10 rounded-lg bg-[#11221A] border border-[#1A402E] flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Operations Assistant Ready</h3>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Query on-hand balances, low stock alerts, supplier lead times, or recent purchase orders.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg text-left">
                  {SUGGESTION_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(prompt)}
                      className="p-2.5 rounded bg-[#0E1015] border border-[#1E232E] hover:border-[#2E3646] hover:bg-[#171A22] text-xs text-gray-300 hover:text-white transition-colors text-left flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <MarkdownMessage content={msg.content} />
                    )}
                    <span className="text-[10px] font-mono text-gray-500 mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai flex items-center gap-1.5 py-2">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <span className="text-[11px] font-mono text-gray-400 ml-1">Analyzing database snapshot...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#1E232E] bg-[#0E1015]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="form-input flex-1 py-1.5 text-xs"
                placeholder="Query inventory records, stock deficits, reorder recommendations..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={chatLoading}
                id="ai-chat-input"
              />
              <button
                onClick={handleSend}
                disabled={chatLoading || !message.trim()}
                className="btn-primary py-1.5 px-3"
                id="ai-send-button"
              >
                {chatLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1 text-center">
              Deterministic responses verified against current MongoDB Atlas state
            </p>
          </div>
        </div>
      )}

      {/* ── Forecast Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-3.5">
          <div className="saas-card p-4 bg-[#111319]">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-56">
                <label className="form-label">Select SKU to Forecast *</label>
                <select
                  className="form-select text-xs"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  id="forecast-product-select"
                >
                  <option value="">— Select Catalog Item —</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.sku} — {p.name} (Stock: {p.totalStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-40">
                <label className="form-label">Projection Horizon</label>
                <select
                  className="form-select text-xs"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Number(e.target.value))}
                >
                  <option value={7}>7 Days Ahead</option>
                  <option value={30}>30 Days Ahead</option>
                  <option value={60}>60 Days Ahead</option>
                  <option value={90}>90 Days Ahead</option>
                </select>
              </div>

              <button
                onClick={handleForecast}
                disabled={!selectedProduct || forecastLoading}
                className="btn-primary"
                id="run-forecast-button"
              >
                {forecastLoading ? 'Computing Model...' : 'Generate Forecast'}
              </button>
            </div>
          </div>

          {forecast && (
            <div className="space-y-3.5">
              {/* Stat Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="saas-card p-3">
                  <span className="text-[11px] text-gray-400 block">Current stock</span>
                  <span className="text-lg font-semibold text-white mt-1 block tabular-nums">
                    {forecast.product?.currentStock} units
                  </span>
                </div>
                <div className="saas-card p-3">
                  <span className="text-[11px] text-gray-400 block">Reorder trigger</span>
                  <span className="text-lg font-semibold text-amber-400 mt-1 block tabular-nums">
                    {forecast.product?.reorderPoint} units
                  </span>
                </div>
                <div className="saas-card p-3">
                  <span className="text-[11px] text-gray-400 block">Runway left</span>
                  <span className={`text-lg font-semibold mt-1 block tabular-nums ${forecast.daysOfStockLeft < 14 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {forecast.daysOfStockLeft} days
                  </span>
                </div>
                <div className="saas-card p-3">
                  <span className="text-[11px] text-gray-400 block">Category mix</span>
                  <span className="text-sm font-semibold text-gray-200 mt-1 block truncate">
                    {forecast.product?.category}
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="saas-card p-3.5">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E232E]">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-200">Demand Forecast Trajectory ({forecastDays} Days)</h3>
                    <p className="text-[11px] text-gray-400">Predicted consumption with ±20% confidence boundaries</p>
                  </div>
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#232834' }} />
                      <YAxis tickLine={false} axisLine={{ stroke: '#232834' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="predicted" name="Projected Demand" stroke="#10B981" strokeWidth={2} fill="url(#forecastFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insight */}
              <div className="saas-card p-3.5 bg-[#0F1E17] border-emerald-900 border-opacity-50">
                <div className="flex items-start gap-3">
                  <Bot className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-emerald-300 text-xs mb-1">
                      Demand Forecast Analysis
                    </p>
                    <MarkdownMessage content={forecast.aiInsight} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Restock Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'restock' && (
        <div className="space-y-3.5">
          <div className="saas-card p-3.5 flex items-center justify-between bg-[#111319]">
            <div>
              <p className="text-xs font-semibold text-white">Automated Replenishment Requisitions</p>
              <p className="text-[10px] text-gray-500 font-mono">
                {(restockRecommendations || []).length} SKUs below safety stock threshold · Estimated replenishment cost:
                <span className="text-white font-semibold font-mono ml-1">
                  ${Number(restockTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
            <button
              onClick={() => dispatch(fetchRestockRecommendations())}
              disabled={restockLoading}
              className="btn-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${restockLoading ? 'animate-spin' : ''}`} />
              <span>Calculate Reorders</span>
            </button>
          </div>

          <div className="saas-card overflow-hidden">
            {restockLoading ? (
              <div className="p-10 text-center text-xs text-gray-400">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Evaluating stock balances and vendor lead times...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Urgency</th>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Current Balance</th>
                      <th>Runway</th>
                      <th>Suggested Qty</th>
                      <th>Est. Cost</th>
                      <th>Vendor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(restockRecommendations || []).map((rec, i) => {
                      const uc = URGENCY_COLORS[rec.urgency] || URGENCY_COLORS.low;
                      return (
                        <tr key={i}>
                          <td>
                            <span className={uc.badge}>{rec.urgency?.toUpperCase()}</span>
                          </td>
                          <td>
                            <span className="font-mono text-[11px] font-semibold text-gray-300 bg-[#1C202A] px-1.5 py-0.5 rounded border border-[#2B3242]">
                              {rec.product.sku}
                            </span>
                          </td>
                          <td className="font-medium text-white text-xs">{rec.product.name}</td>
                          <td className="text-xs text-gray-400">{rec.product.category}</td>
                          <td className="font-mono text-xs font-semibold text-white">
                            {rec.currentStock}
                          </td>
                          <td>
                            <span className={`font-mono text-xs font-semibold ${rec.daysOfStockLeft < 7 ? 'text-rose-400' : 'text-amber-400'}`}>
                              {rec.daysOfStockLeft} days
                            </span>
                          </td>
                          <td className="font-mono font-semibold text-white text-xs">
                            {rec.recommendedQty} units
                          </td>
                          <td className="font-mono font-semibold text-emerald-400 text-xs">
                            ${Number(rec.estimatedCost).toLocaleString()}
                          </td>
                          <td className="text-xs text-gray-400">{rec.supplier?.name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
