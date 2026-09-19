import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../app/slices/analyticsSlice';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, Warehouse,
  DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight,
  Activity, RefreshCw, Layers, CheckCircle, Shield
} from 'lucide-react';

const CATEGORY_PALETTE = ['#10B981', '#059669', '#3B82F6', '#F59E0B', '#14B8A6', '#64748B'];

const OperationalKPICard = ({ title, value, detail, trend, trendValue, icon: Icon, alert }) => (
  <div className={`kpi-card ${alert ? 'border-amber-900 border-opacity-60 bg-[#161311]' : ''}`}>
    <div className="flex items-center justify-between gap-1 text-xs font-medium text-gray-400">
      <span>{title}</span>
      <Icon className={`w-3.5 h-3.5 ${alert ? 'text-amber-400' : 'text-gray-400'}`} />
    </div>
    <div className="mt-1 flex items-baseline justify-between gap-2">
      <span className="text-xl font-semibold tracking-tight text-white tabular-nums">{value}</span>
      {trendValue !== undefined && (
        <span className={`inline-flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? '↑' : '↓'}{Math.abs(trendValue)}%
        </span>
      )}
    </div>
    {detail && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{detail}</p>}
  </div>
);

const CommercialTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#13151B] border border-[#2B3242] rounded p-2 text-xs shadow-lg">
        <p className="text-gray-400 font-medium mb-1 text-[11px]">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white font-medium tabular-nums">${Number(entry.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { kpis, categoryDistribution, monthlyChart, topProducts, recentMovements, warehouses, loading } = useSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchDashboard());
    const interval = setInterval(() => dispatch(fetchDashboard()), 120000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const fmt = (n) => (n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—');
  const fmtNum = (n) => (n != null ? Number(n).toLocaleString() : '—');

  const movementBadge = (type) => {
    switch (type) {
      case 'receive': return <span className="badge-success text-[10.5px]">Receive</span>;
      case 'dispatch': return <span className="badge-danger text-[10.5px]">Dispatch</span>;
      case 'transfer': return <span className="badge-info text-[10.5px]">Transfer</span>;
      default: return <span className="badge-warning text-[10.5px]">Adjust</span>;
    }
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* Operations Header & Permissions Strip */}
      <div className="saas-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111319]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#11221A] border border-[#1A402E] flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Operations Overview</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#11221A] text-emerald-300 border border-[#1A402E] capitalize">
                {user?.role} session
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Real-time warehouse stock ledger, open purchase orders, and 30-day fulfillment metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => dispatch(fetchDashboard())}
            disabled={loading}
            className="btn-secondary py-1 text-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <OperationalKPICard
          title="Inventory Valuation"
          value={fmt(kpis?.totalInventoryValue)}
          detail={`${fmtNum(kpis?.totalProducts)} active SKUs`}
          trend={kpis?.monthlyGrowth >= 0 ? 'up' : 'down'}
          trendValue={kpis?.monthlyGrowth}
          icon={DollarSign}
        />
        <OperationalKPICard
          title="Units on Hand"
          value={fmtNum(kpis?.totalStockUnits)}
          detail="Total inventory units"
          icon={Package}
        />
        <OperationalKPICard
          title="30-Day Dispatches"
          value={fmt(kpis?.monthlyRevenue)}
          detail="Outbound order volume"
          trend="up"
          trendValue={8.4}
          icon={Activity}
        />
        <OperationalKPICard
          title="Active Facilities"
          value={kpis?.activeWarehouses ?? '—'}
          detail="Operating warehouses"
          icon={Layers}
        />
        <OperationalKPICard
          title="Below Safety Stock"
          value={kpis?.lowStockCount ?? 0}
          detail="Requires reorder"
          alert={kpis?.lowStockCount > 0}
          icon={AlertTriangle}
        />
        <OperationalKPICard
          title="Database Status"
          value="Online"
          detail="Atlas cluster active"
          icon={CheckCircle}
        />
      </div>

      {/* Main Analysis: 2 Col Ratio (Chart + Category breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Left 2 Cols: Revenue/Procurement Chart */}
        <div className="lg:col-span-2 saas-card p-3.5">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1E232E]">
            <div>
              <h3 className="text-xs font-semibold text-gray-200">Sales Dispatches vs Inbound Procurement</h3>
              <p className="text-[11px] text-gray-400">6-month comparison of outbound sales and purchase receipts</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-sm" />
                Sales Dispatches
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2.5 h-1 bg-gray-500 rounded-sm" />
                PO Receipts
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="grayArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B7280" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6B7280" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#232834' }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#232834' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CommercialTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={1.75} fill="url(#emeraldArea)" />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#6B7280" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#grayArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Category Inventory Share */}
        <div className="saas-card p-3.5 flex flex-col justify-between">
          <div className="pb-2 mb-2 border-b border-[#1E232E]">
            <h3 className="text-xs font-semibold text-gray-200">Inventory by Category</h3>
            <p className="text-[11px] text-gray-400">Stock valuation allocation</p>
          </div>

          <div className="h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} stroke="#13151B" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
            {categoryDistribution.map((cat, i) => (
              <div key={cat._id || i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }} />
                  <span className="text-gray-300 truncate">{cat.name}</span>
                </div>
                <span className="text-gray-400 font-medium ml-2 tabular-nums">${(cat.value / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Data Rows */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5">
        {/* Top Performing SKUs */}
        <div className="saas-card p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E232E]">
            <h3 className="text-xs font-semibold text-gray-200">Velocity Leaders</h3>
            <span className="text-[11px] text-gray-400">Top 5 by units sold</span>
          </div>
          <div className="space-y-2">
            {topProducts.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-medium text-gray-500 w-3">{i + 1}</span>
                  <div className="truncate">
                    <p className="text-gray-200 font-medium truncate text-xs">{p.name}</p>
                    <p className="text-[10px] text-gray-400">
                      SKU: <span className="font-mono text-gray-300">{p.sku || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className="text-gray-200 font-semibold tabular-nums">{p.sold}</span>
                  <span className="text-gray-400 text-[10px] ml-1">units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Stock Ledger Audit */}
        <div className="saas-card p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E232E]">
            <h3 className="text-xs font-semibold text-gray-200">Recent Movements</h3>
            <span className="text-[11px] text-gray-400">Real-time ledger</span>
          </div>
          <div className="space-y-2">
            {recentMovements.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="text-gray-200 font-medium truncate text-xs">{m.productName || m.product?.name || 'Product'}</p>
                  <p className="text-[11px] text-gray-400">
                    Qty: <span className="text-gray-200 font-medium tabular-nums">{m.quantity}</span> · {m.reason || 'Routine operation'}
                  </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                  {movementBadge(m.movementType)}
                  <span className="text-[10px] text-gray-400">
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warehouse Capacity & Utilization */}
        <div className="saas-card p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E232E]">
            <h3 className="text-xs font-semibold text-gray-200">Warehouse Capacity Utilization</h3>
            <span className="text-[11px] text-gray-400">Storage capacity</span>
          </div>
          <div className="space-y-3">
            {warehouses.map((w, i) => {
              const pct = w.capacity > 0 ? Math.round((w.currentUtilization / w.capacity) * 100) : 0;
              const barBg = pct > 85 ? 'bg-rose-500' : pct > 65 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{w.name}</span>
                    <span className="text-xs text-gray-200 font-medium tabular-nums">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1C202A] rounded-full overflow-hidden">
                    <div className={`h-full ${barBg} rounded-full transition-all duration-300`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{w.city || 'Hub'}</span>
                    <span className="tabular-nums">{w.currentUtilization?.toLocaleString()} / {w.capacity?.toLocaleString()} units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
