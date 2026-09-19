import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, createOrder, updateOrderStatus } from '../app/slices/orderSlice';
import { fetchProducts } from '../app/slices/productSlice';
import { fetchWarehouses } from '../app/slices/warehouseSlice';
import { fetchSuppliers } from '../app/slices/supplierSlice';
import { ShoppingCart, Plus, X, Truck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-emerald',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

const CreateOrderModal = ({ orderType, products, warehouses, suppliers, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({
    orderType,
    warehouse: warehouses[0]?._id || '',
    supplier: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [{ product: '', quantity: 1, unitPrice: 0 }],
    taxRate: 0.1,
    discountAmount: 0,
    notes: '',
    paymentMethod: 'bank_transfer',
  });

  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    if (field === 'product') {
      const p = products.find((prod) => prod._id === val);
      if (p) items[idx].unitPrice = orderType === 'purchase' ? p.costPrice : p.sellingPrice;
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const subtotal = form.items.reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const tax = subtotal * form.taxRate;
  const total = subtotal + tax - (form.discountAmount || 0);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E232E] bg-[#0E1015]">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Create New {orderType === 'purchase' ? 'Purchase Order (PO)' : 'Sales Order (SO)'}
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">Operations transaction generation & stock impact</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ ...form, items: form.items.filter((it) => it.product) });
          }}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {orderType === 'purchase' ? (
              <div className="col-span-2">
                <label className="form-label">Vendor / Supplier *</label>
                <select
                  className="form-select"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  required
                >
                  <option value="">— Select Supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code || 'SUP'})</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input
                    className="form-input"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Acme Logistics Corp"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Customer Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="procurement@acme.com"
                  />
                </div>
              </>
            )}

            <div>
              <label className="form-label">Target Facility (Warehouse) *</label>
              <select
                className="form-select"
                value={form.warehouse}
                onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Payment Terms</label>
              <select
                className="form-select"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                {['bank_transfer', 'credit_card', 'cash', 'check'].map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label m-0">Line Items *</label>
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-1.5">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 p-2 rounded bg-[#0E1015] border border-[#1E232E]">
                  <div className="col-span-3">
                    <select
                      className="form-select py-1 text-xs"
                      value={item.product}
                      onChange={(e) => updateItem(idx, 'product', e.target.value)}
                      required={idx === 0}
                    >
                      <option value="">— Select Product SKU —</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.sku} — {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input py-1 text-xs font-mono"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input py-1 text-xs font-mono"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-gray-300 pr-1">
                    <span>${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</span>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotals Box */}
          <div className="p-3 rounded bg-[#0E1015] border border-[#1E232E] space-y-1 text-xs font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-white border-t border-[#1E232E] pt-1 mt-1">
              <span>Total Amount:</span>
              <span className="text-emerald-400 font-bold">${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="form-label">Notes & Instructions</label>
            <input
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Standard freight delivery"
            />
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-[#1E232E]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Orders = () => {
  const dispatch = useDispatch();
  const { items: orders, loading } = useSelector((s) => s.orders);
  const { items: products } = useSelector((s) => s.products);
  const { items: warehouses } = useSelector((s) => s.warehouses);
  const { items: suppliers } = useSelector((s) => s.suppliers);
  const { user } = useSelector((s) => s.auth);

  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders({ type: tab === 'all' ? undefined : tab }));
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
    dispatch(fetchSuppliers());
  }, [dispatch, tab]);

  const handleSubmit = async (form) => {
    setSubmitLoading(true);
    await dispatch(createOrder(form));
    setSubmitLoading(false);
    setModal(null);
    dispatch(fetchOrders({ type: tab === 'all' ? undefined : tab }));
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    await dispatch(updateOrderStatus({ id: orderId, data: { status: newStatus } }));
    dispatch(fetchOrders({ type: tab === 'all' ? undefined : tab }));
  };

  const canManage = ['admin', 'manager'].includes(user?.role);
  const filteredOrders = tab === 'all' ? orders : orders.filter((o) => o.orderType === tab);

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Purchase & Sales Orders</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#11221A] text-emerald-300 border border-[#1A402E]">
              {orders.length} orders
            </span>
            {!canManage && (
              <span className="badge-warning text-[11px] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Inbound vendor purchase orders (PO) and outbound customer sales orders (SO)
          </p>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setModal('purchase')} className="btn-secondary">
              <Truck className="w-3.5 h-3.5" />
              <span>New PO</span>
            </button>
            <button
              onClick={() => setModal('sales')}
              className="btn-primary"
              id="new-sales-order-button"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>New SO</span>
            </button>
          </div>
        )}
      </div>

      {/* Segmented Tab Filter */}
      <div className="inline-flex p-0.5 bg-[#0E1015] border border-[#232834] rounded-md text-xs">
        {[
          ['all', 'All Orders'],
          ['purchase', 'Purchase Orders (PO)'],
          ['sales', 'Sales Orders (SO)'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-3 py-1.5 rounded transition-colors font-medium ${
              tab === v
                ? 'bg-[#1A1E29] text-white border border-[#2B3242]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {l}
            <span className="ml-1.5 text-[11px] text-gray-400 tabular-nums">
              ({orders.filter((o) => v === 'all' || o.orderType === v).length})
            </span>
          </button>
        ))}
      </div>

      {/* Dense Orders Table */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Type</th>
                  <th>Counterparty</th>
                  <th>Facility</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Fulfillment Status</th>
                  <th>Payment</th>
                  <th>Created</th>
                  {canManage && <th className="text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="font-mono text-[11px] font-semibold text-gray-200 bg-[#1C202A] px-2 py-0.5 rounded border border-[#2B3242]">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <span className={order.orderType === 'purchase' ? 'badge-emerald' : 'badge-info'}>
                        {order.orderType === 'purchase' ? 'PO' : 'SO'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-200 font-medium">
                      {order.supplierName || order.customerName || '—'}
                    </td>
                    <td className="text-xs text-gray-400">
                      {order.warehouseName || order.warehouse?.name || '—'}
                    </td>
                    <td className="text-xs text-gray-400 tabular-nums">
                      {order.items?.length || 0} items
                    </td>
                    <td className="text-xs font-semibold text-white tabular-nums">
                      ${Number(order.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={STATUS_COLORS[order.status] || 'badge-gray'}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          order.paymentStatus === 'paid'
                            ? 'badge-success'
                            : order.paymentStatus === 'partial'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }
                      >
                        {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : '—'}
                      </span>
                    </td>
                    <td className="text-[11px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="text-right">
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <select
                            className="text-xs bg-[#0E1015] border border-[#232834] rounded px-2 py-0.5 text-gray-300 capitalize"
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          >
                            {STATUS_STEPS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                            <option value="cancelled">cancelled</option>
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <CreateOrderModal
          orderType={modal}
          products={products}
          warehouses={warehouses}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={submitLoading}
        />
      )}
    </div>
  );
};

export default Orders;
