import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovements } from '../app/slices/analyticsSlice';
import { ClipboardList, ArrowUpRight, ArrowDownRight, ArrowRightLeft, RefreshCw } from 'lucide-react';

const MOVEMENT_CONFIG = {
  receive: { label: 'Receive', badge: 'badge-success' },
  dispatch: { label: 'Dispatch', badge: 'badge-danger' },
  transfer: { label: 'Transfer', badge: 'badge-info' },
  adjustment: { label: 'Adjust', badge: 'badge-warning' },
  return: { label: 'Return', badge: 'badge-emerald' },
};

const AuditLog = () => {
  const dispatch = useDispatch();
  const { movements = [], movementsTotal = 0 } = useSelector((s) => s.analytics || {});
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 30;

  useEffect(() => {
    dispatch(fetchMovements({ type: type !== 'all' ? type : undefined, page, limit }));
  }, [dispatch, type, page]);

  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Stock Movement Audit Ledger</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171A22] text-gray-400 border border-[#232834]">
              {movementsTotal} movements recorded
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Immutable transaction history for inbound receipts, outbound dispatches, and warehouse transfers
          </p>
        </div>

        <button
          onClick={() => dispatch(fetchMovements({ type: type !== 'all' ? type : undefined, page, limit }))}
          className="btn-secondary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Segmented Filter */}
      <div className="inline-flex p-0.5 bg-[#0E1015] border border-[#232834] rounded-md text-xs">
        {['all', 'receive', 'dispatch', 'transfer', 'adjustment', 'return'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded capitalize transition-colors font-medium ${
              type === t
                ? 'bg-[#1A1E29] text-white border border-[#2B3242]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Delta Qty</th>
                <th>Source (From)</th>
                <th>Destination (To)</th>
                <th>Reason</th>
                <th>Operator</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500 font-mono text-xs">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    No audit records registered
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const mc = MOVEMENT_CONFIG[m.movementType] || MOVEMENT_CONFIG.adjustment;
                  return (
                    <tr key={m._id}>
                      <td>
                        <span className={mc.badge}>{mc.label}</span>
                      </td>
                      <td>
                        <span className="font-mono text-[11px] font-semibold text-gray-300 bg-[#1C202A] px-1.5 py-0.5 rounded border border-[#2B3242]">
                          {m.sku || m.product?.sku || 'SKU'}
                        </span>
                      </td>
                      <td className="font-medium text-white text-xs truncate max-w-[200px]">
                        {m.productName || m.product?.name || 'Product'}
                      </td>
                      <td className="font-mono text-xs">
                        <span
                          className={`font-semibold ${
                            m.movementType === 'dispatch' || m.quantity < 0
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {m.movementType === 'dispatch' ? '-' : '+'}{Math.abs(m.quantity)}
                        </span>
                      </td>
                      <td className="text-xs text-gray-400">
                        {m.fromWarehouseName || m.fromWarehouse?.name || '—'}
                      </td>
                      <td className="text-xs text-gray-400">
                        {m.toWarehouseName || m.toWarehouse?.name || '—'}
                      </td>
                      <td className="text-xs text-gray-400 max-w-[180px] truncate">
                        {m.reason || '—'}
                      </td>
                      <td className="text-xs text-gray-300 font-mono">
                        {m.performedByName || m.performedBy?.name || 'System'}
                      </td>
                      <td className="text-[11px] font-mono text-gray-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {movementsTotal > limit && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1E232E] bg-[#0E1015] text-xs font-mono">
            <span className="text-gray-500">
              Showing {Math.min(page * limit, movementsTotal)} of {movementsTotal} events
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1 text-xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= movementsTotal}
                className="btn-secondary py-1 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
