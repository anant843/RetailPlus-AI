import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWarehouses, transferStock } from '../app/slices/warehouseSlice';
import { fetchProducts } from '../app/slices/productSlice';
import { ArrowRightLeft, X, CheckCircle2, AlertCircle } from 'lucide-react';

const TransferModal = ({ warehouses, products, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: 1, reason: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductSelect = (e) => {
    const p = products.find((prod) => prod._id === e.target.value);
    setSelectedProduct(p);
    setForm({ ...form, productId: e.target.value });
  };

  const getAvailableStock = () => {
    if (!selectedProduct || !form.fromWarehouseId) return 0;
    const ws = selectedProduct.warehouseStock?.find(
      (w) => (w.warehouse?._id || w.warehouse) === form.fromWarehouseId
    );
    return ws?.quantity || 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg bg-[#0F1629] border border-[#1E293B]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]/70 bg-[#0D1322]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Transfer Inventory
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Move items between operational facilities</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-[#131C33] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Select Item *</label>
            <select className="form-select" value={form.productId} onChange={handleProductSelect} required>
              <option value="">— Select Catalog Item —</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.sku} — {p.name} ({p.totalStock} in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Origin Facility (From) *</label>
              <select
                className="form-select"
                value={form.fromWarehouseId}
                onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
                required
              >
                <option value="">— Origin —</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Destination (To) *</label>
              <select
                className="form-select"
                value={form.toWarehouseId}
                onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
                required
              >
                <option value="">— Destination —</option>
                {warehouses
                  .filter((w) => w._id !== form.fromWarehouseId)
                  .map((w) => (
                    <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                  ))}
              </select>
            </div>
          </div>

          {form.fromWarehouseId && selectedProduct && (
            <div className="py-2 px-3 rounded bg-[#0B1020] border border-[#1E293B]/70 text-xs text-[#94A3B8] flex items-center justify-between">
              <span>Available balance at origin:</span>
              <span className="font-semibold text-white tabular-nums">{getAvailableStock()} units</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Quantity to Transfer *</label>
            <input
              type="number"
              className="form-input"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              min="1"
              max={getAvailableStock() || undefined}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Operational Note</label>
            <input
              className="form-input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Rebalance regional safety stock"
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#1E293B]/60">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Transfer Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Warehouses = () => {
  const dispatch = useDispatch();
  const { items: warehouses, loading, transferLoading } = useSelector((s) => s.warehouses);
  const { items: products } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const [transferModal, setTransferModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    dispatch(fetchWarehouses());
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleTransfer = async (form) => {
    const result = await dispatch(transferStock(form));
    if (transferStock.fulfilled.match(result)) {
      setToast({ type: 'success', msg: result.payload.message || 'Transfer completed.' });
      setTransferModal(false);
      dispatch(fetchProducts());
      dispatch(fetchWarehouses());
    } else {
      setToast({ type: 'error', msg: result.payload || 'Transfer failed.' });
    }
    setTimeout(() => setToast(null), 3500);
  };

  const canTransfer = ['admin', 'manager'].includes(user?.role);

  // Executive metrics calculations
  const totalCapacity = useMemo(
    () => warehouses.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0),
    [warehouses]
  );

  const totalUtilized = useMemo(
    () => warehouses.reduce((sum, w) => sum + (Number(w.currentUtilization) || 0), 0),
    [warehouses]
  );

  const netUtilizationPct = useMemo(
    () => (totalCapacity > 0 ? Math.round((totalUtilized / totalCapacity) * 100) : 0),
    [totalCapacity, totalUtilized]
  );

  const stockedSkusCount = useMemo(
    () => products.filter((p) => p.warehouseStock?.some((ws) => ws.quantity > 0)).length,
    [products]
  );

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-md shadow-xl text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-rose-950 border border-rose-800 text-rose-300'
              : 'bg-[#0C1F18] border border-emerald-800/80 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]/60">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Warehouses</h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Storage capacity, facility utilization, and inter-hub transfers
          </p>
        </div>

        {canTransfer && (
          <button
            onClick={() => setTransferModal(true)}
            className="btn-primary self-start sm:self-auto"
            id="transfer-stock-button"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Inventory</span>
          </button>
        )}
      </div>

      {/* Executive KPI Ribbon — Compact & Minimal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#0F1629] border border-[#1E293B]/70">
          <span className="text-xs font-medium text-[#94A3B8] block">Network Storage Capacity</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
              {totalCapacity.toLocaleString()}
            </span>
            <span className="text-xs text-[#64748B]">units</span>
          </div>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">Total across all sites</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0F1629] border border-[#1E293B]/70">
          <span className="text-xs font-medium text-[#94A3B8] block">Storage Utilization</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
              {totalUtilized.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400 tabular-nums">
              {netUtilizationPct}% load
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">Currently occupied units</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0F1629] border border-[#1E293B]/70">
          <span className="text-xs font-medium text-[#94A3B8] block">Active Facilities</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
              {warehouses.length}
            </span>
            <span className="text-xs text-emerald-400">Hubs</span>
          </div>
          <span className="text-[11px] text-emerald-400/90 mt-0.5 block">100% operational</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#0F1629] border border-[#1E293B]/70">
          <span className="text-xs font-medium text-[#94A3B8] block">Catalog Items Stored</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
              {stockedSkusCount}
            </span>
            <span className="text-xs text-[#64748B]">active SKUs</span>
          </div>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">Stocked in facility matrix</span>
        </div>
      </div>

      {/* Facility Cards Grid — Decreased height (15%+), minimal borders, no nested boxes */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white tracking-tight">Facility Details</h2>
          <p className="text-xs text-[#94A3B8]">Operational status and capacity allocation</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-[#94A3B8] rounded-lg bg-[#0F1629] border border-[#1E293B]/70">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading facilities...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {warehouses.map((warehouse) => {
              const pct = warehouse.capacity > 0 ? Math.round((warehouse.currentUtilization / warehouse.capacity) * 100) : 0;
              const barBg = pct > 85 ? 'bg-rose-500' : pct > 65 ? 'bg-amber-500' : 'bg-emerald-500';
              const skuCount = products.filter((p) =>
                p.warehouseStock?.some((ws) => (ws.warehouse?._id || ws.warehouse) === warehouse._id && ws.quantity > 0)
              ).length;

              return (
                <div
                  key={warehouse._id}
                  className="p-3.5 rounded-lg bg-[#0F1629] border border-[#1E293B]/70 hover:border-[#334155] transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">{warehouse.name}</h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {[warehouse.city, warehouse.country].filter(Boolean).join(', ') || 'Regional Facility'}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 bg-[#0C1F18] px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {warehouse.code}
                    </span>
                  </div>

                  {/* Clean Utilization Metric & Slim Bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#94A3B8]">Utilization</span>
                      <span className="text-white font-medium tabular-nums">
                        {Number(warehouse.currentUtilization).toLocaleString()} / {Number(warehouse.capacity).toLocaleString()} units ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B1020] rounded-full overflow-hidden">
                      <div className={`h-full ${barBg} rounded-full transition-all duration-300`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>

                  {/* Clean Subtle Footer Divider */}
                  <div className="pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>{warehouse.type || 'Fulfillment Hub'}</span>
                    <span>{skuCount} SKUs stocked</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Inventory Summary — Replacing the bulky matrix table */}
      <div className="rounded-lg bg-[#0F1629] border border-[#1E293B]/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1E293B]/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Facility Inventory Summary</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Network capacity balance and operational health overview</p>
          </div>
          <span className="text-xs text-[#94A3B8]">
            {warehouses.length} active locations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B]/70 bg-[#0D1322]">
                <th className="py-2.5 px-4 font-medium text-[#94A3B8]">Facility</th>
                <th className="py-2.5 px-4 font-medium text-[#94A3B8]">Location</th>
                <th className="py-2.5 px-4 font-medium text-[#94A3B8]">Hub Type</th>
                <th className="py-2.5 px-4 font-medium text-[#94A3B8] text-right">Capacity</th>
                <th className="py-2.5 px-4 font-medium text-[#94A3B8] text-right">Units Occupied</th>
                <th className="py-2.5 px-4 font-medium text-[#94A3B8] text-right">Utilization</th>
                <th className="py-2.5 px-4 font-medium text-[#94A3B8] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/40">
              {warehouses.map((w) => {
                const pct = w.capacity > 0 ? Math.round((w.currentUtilization / w.capacity) * 100) : 0;
                return (
                  <tr key={w._id} className="hover:bg-[#131C33]/50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-white">{w.name}</div>
                      <div className="font-mono text-[11px] text-emerald-400 mt-0.5">{w.code}</div>
                    </td>
                    <td className="py-2.5 px-4 text-[#94A3B8]">
                      {[w.city, w.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-[#94A3B8]">
                      {w.type || 'Fulfillment Center'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-white font-medium tabular-nums">
                      {Number(w.capacity).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#CBD5E1] tabular-nums">
                      {Number(w.currentUtilization).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">
                      <span className={`font-medium ${pct > 85 ? 'text-rose-400' : pct > 65 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Operational
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {transferModal && (
        <TransferModal
          warehouses={warehouses}
          products={products}
          onClose={() => setTransferModal(false)}
          onSubmit={handleTransfer}
          loading={transferLoading}
        />
      )}
    </div>
  );
};

export default Warehouses;
