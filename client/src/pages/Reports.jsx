import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { analyticsAPI, productAPI } from '../services/api';
import { BarChart3, Download, TrendingUp, Package, DollarSign, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PALETTE = ['#10B981', '#059669', '#3B82F6', '#F59E0B', '#14B8A6', '#64748B'];

const Reports = () => {
  const { user } = useSelector((s) => s.auth);
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, prods] = await Promise.all([
          analyticsAPI.getDashboard(),
          productAPI.getAll({ limit: 100 }),
        ]);
        setDashboard(dash.data);
        setProducts(prods.data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((row) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportInventoryReport = () => {
    const data = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      Brand: p.brand,
      CostPrice: p.costPrice,
      SellingPrice: p.sellingPrice,
      TotalStock: p.totalStock,
      MinStock: p.minStockLevel,
      ReorderPoint: p.reorderPoint,
      CostValuation: (p.totalStock * p.costPrice).toFixed(2),
      RetailValuation: (p.totalStock * p.sellingPrice).toFixed(2),
      SoldQuantity: p.soldQuantity,
      Status: p.totalStock <= 0 ? 'Out of Stock' : p.totalStock <= p.reorderPoint ? 'Low Stock' : 'In Stock',
    }));
    exportCSV(data, 'inventory_master_valuation');
  };

  const exportRevenueReport = () => {
    if (!dashboard?.monthlyChart) return;
    exportCSV(
      dashboard.monthlyChart.map((m) => ({
        Month: m.month,
        Revenue: m.revenue,
        Purchases: m.purchases,
        GrossProfit: m.profit,
      })),
      'monthly_revenue_ledger'
    );
  };

  const exportRestockReport = () => {
    const data = products
      .filter((p) => p.totalStock <= p.reorderPoint)
      .map((p) => ({
        SKU: p.sku,
        Name: p.name,
        CurrentStock: p.totalStock,
        ReorderPoint: p.reorderPoint,
        MinStock: p.minStockLevel,
        ReorderQty: p.reorderQuantity || 50,
        EstProcurementCost: ((p.reorderQuantity || 50) * p.costPrice).toFixed(2),
      }));
    exportCSV(data, 'reorder_urgent_requisition');
  };

  if (loading) {
    return (
      <div className="saas-card p-10 text-center text-xs text-gray-400">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Generating valuation reports...</span>
      </div>
    );
  }

  const kpis = dashboard?.kpis;
  const topProducts = dashboard?.topProducts || [];
  const categoryDist = dashboard?.categoryDistribution || [];

  const inventoryByCategory = categoryDist.map((c) => ({
    name: c.name,
    value: c.stock,
    revenue: Math.round(c.value),
  }));

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Valuation Reports & Ledger Exports</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171A22] text-gray-400 border border-[#232834]">
              Financial audit
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Inventory valuation summaries, gross margin calculations, and exportable CSV ledgers
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="saas-card p-3">
          <span className="text-[11px] text-gray-400 block">Total cost valuation</span>
          <span className="text-lg font-semibold text-white mt-1 block tabular-nums">
            ${Number(kpis?.totalInventoryValue || 0).toLocaleString()}
          </span>
        </div>
        <div className="saas-card p-3">
          <span className="text-[11px] text-gray-400 block">Rolling 30-day revenue</span>
          <span className="text-lg font-semibold text-white mt-1 block tabular-nums">
            ${Number(kpis?.monthlyRevenue || 0).toLocaleString()}
          </span>
        </div>
        <div className="saas-card p-3">
          <span className="text-[11px] text-gray-400 block">Active product SKUs</span>
          <span className="text-lg font-semibold text-white mt-1 block tabular-nums">
            {kpis?.totalProducts || 0}
          </span>
        </div>
        <div className="saas-card p-3">
          <span className="text-[11px] text-gray-400 block">Gross margin</span>
          <span className="text-lg font-semibold text-emerald-400 mt-1 block tabular-nums">
            {kpis?.grossMargin || 0}%
          </span>
        </div>
      </div>

      {/* Structured CSV Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            title: 'Master Inventory Valuation',
            desc: `Export complete ledger with unit costs and retail valuations for ${products.length} catalog items`,
            onClick: exportInventoryReport,
            id: 'export-inventory',
          },
          {
            title: 'Monthly Cash Flow & Margin',
            desc: '6-month historical trajectory of customer billings vs vendor replenishment disbursements',
            onClick: exportRevenueReport,
            id: 'export-revenue',
          },
          {
            title: 'Replenishment Requisition',
            desc: `${products.filter((p) => p.totalStock <= p.reorderPoint).length} SKU deficits requiring purchase order generation`,
            onClick: exportRestockReport,
            id: 'export-restock',
          },
        ].map((r, i) => (
          <div key={i} className="saas-card p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <h3 className="text-xs font-semibold text-white">{r.title}</h3>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">{r.desc}</p>
            </div>
            <button
              onClick={r.onClick}
              className="btn-secondary w-full text-xs"
              id={r.id}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV File</span>
            </button>
          </div>
        ))}
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Top Products by Revenue */}
        <div className="saas-card p-4">
          <div className="pb-2 mb-3 border-b border-[#1E232E]">
            <h3 className="text-xs font-semibold text-gray-200">Revenue Leaders by SKU</h3>
            <p className="text-[10px] text-gray-500 font-mono">Gross revenue generated across orders</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={{ stroke: '#232834' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={{ stroke: '#232834' }} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[0, 3, 3, 0]}>
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Units by Category */}
        <div className="saas-card p-4">
          <div className="pb-2 mb-3 border-b border-[#1E232E]">
            <h3 className="text-xs font-semibold text-gray-200">Physical Volume by Category</h3>
            <p className="text-[10px] text-gray-500 font-mono">Total on-hand units stocked in facilities</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryByCategory} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#232834' }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#232834' }} />
                <Tooltip formatter={(v) => [`${v} units`, 'Inventory']} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {inventoryByCategory.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Inventory Valuation Master Table */}
      <div className="saas-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1E232E] bg-[#0E1015] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-gray-200">Inventory Valuation Rollup</h3>
            <p className="text-[10px] text-gray-500 font-mono">Per-item safety thresholds, unit costs, and gross margins</p>
          </div>
          <button onClick={exportInventoryReport} className="btn-secondary py-1 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export Master</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Balance</th>
                <th>Cost</th>
                <th>Retail</th>
                <th>Margin</th>
                <th>Holding Cost</th>
                <th>Retail Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 20).map((p) => {
                const margin =
                  p.sellingPrice > 0
                    ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                    : 0;
                const costVal = p.totalStock * p.costPrice;
                const retVal = p.totalStock * p.sellingPrice;
                return (
                  <tr key={p._id}>
                    <td>
                      <span className="font-mono text-[11px] font-semibold text-gray-300 bg-[#1C202A] px-1.5 py-0.5 rounded border border-[#2B3242]">
                        {p.sku}
                      </span>
                    </td>
                    <td className="font-medium text-white text-xs truncate max-w-[180px]">{p.name}</td>
                    <td className="text-xs text-gray-400">{p.category}</td>
                    <td className="font-mono font-semibold text-white text-xs">{p.totalStock}</td>
                    <td className="font-mono text-gray-400 text-xs">${Number(p.costPrice).toFixed(2)}</td>
                    <td className="font-mono font-medium text-gray-200 text-xs">${Number(p.sellingPrice).toFixed(2)}</td>
                    <td>
                      <span
                        className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          margin >= 35
                            ? 'bg-[#064E3B] bg-opacity-40 text-emerald-400 border border-emerald-800'
                            : margin >= 15
                            ? 'bg-[#78350F] bg-opacity-40 text-amber-400 border border-amber-800'
                            : 'bg-[#881337] bg-opacity-40 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {margin}%
                      </span>
                    </td>
                    <td className="font-mono text-gray-300 text-xs">
                      ${Number(costVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-mono font-semibold text-white text-xs">
                      ${Number(retVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      {p.totalStock <= 0 ? (
                        <span className="badge-danger">ZERO STOCK</span>
                      ) : p.totalStock <= p.reorderPoint ? (
                        <span className="badge-warning">LOW STOCK</span>
                      ) : (
                        <span className="badge-success">IN STOCK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
