import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../app/slices/supplierSlice';
import { Truck, Plus, Edit2, Trash2, Star, Mail, Phone, Search, X, Globe, Building2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const PAYMENT_TERMS = { net_15: 'Net 15', net_30: 'Net 30', net_45: 'Net 45', net_60: 'Net 60', cod: 'COD' };

const SupplierModal = ({ supplier, onClose, onSubmit, loading }) => {
  const isEdit = !!supplier;
  const [form, setForm] = useState(
    supplier || {
      code: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'USA',
      website: '',
      leadTimeDays: 7,
      rating: 4.0,
      paymentTerms: 'net_30',
      categories: [],
      notes: '',
    }
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E232E] bg-[#0E1015]">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              {isEdit ? `Edit Vendor: ${supplier?.code}` : 'Register Vendor / Supplier'}
            </h2>
            <p className="text-[10px] text-gray-400">Supply chain partner directory and lead time parameters</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="p-5 space-y-3.5"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Vendor Code *</label>
              <input
                className="form-input font-mono uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUP-101"
                required
              />
            </div>
            <div>
              <label className="form-label">Company Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Apex Microelectronics Ltd"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Key Contact</label>
              <input
                className="form-input"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Marcus Vance"
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="orders@apex.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
              />
            </div>
            <div>
              <label className="form-label">City / HQ</label>
              <input
                className="form-input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Austin, TX"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Lead Time (days)</label>
              <input
                type="number"
                className="form-input"
                value={form.leadTimeDays}
                onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="form-label">Rating (0-5)</label>
              <input
                type="number"
                className="form-input"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                min="0"
                max="5"
                step="0.1"
              />
            </div>
            <div>
              <label className="form-label">Payment Terms</label>
              <select
                className="form-select"
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              >
                {Object.entries(PAYMENT_TERMS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-[#1E232E]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Vendor' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Suppliers = () => {
  const dispatch = useDispatch();
  const { items: suppliers, loading } = useSelector((s) => s.suppliers);
  const { user } = useSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchSuppliers({ search })), 300);
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  const handleSubmit = async (form) => {
    setSubmitLoading(true);
    try {
      if (editSupplier) {
        await dispatch(updateSupplier({ id: editSupplier._id, data: form })).unwrap();
        setToast({ type: 'success', msg: `Supplier ${form.name} updated.` });
      } else {
        await dispatch(createSupplier(form)).unwrap();
        setToast({ type: 'success', msg: `Supplier ${form.name} registered.` });
      }
      setSubmitLoading(false);
      setModal(false);
      setEditSupplier(null);
      dispatch(fetchSuppliers());
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setSubmitLoading(false);
      setToast({ type: 'error', msg: typeof err === 'string' ? err : 'Failed to save supplier.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (id, name) => {
    setSubmitLoading(true);
    try {
      await dispatch(deleteSupplier(id)).unwrap();
      setDeleteTarget(null);
      setSubmitLoading(false);
      setToast({ type: 'success', msg: `Supplier "${name}" deleted.` });
      dispatch(fetchSuppliers());
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setSubmitLoading(false);
      setToast({ type: 'error', msg: typeof err === 'string' ? err : 'Failed to delete supplier.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const canEdit = ['admin', 'manager'].includes(user?.role);

  return (
    <div className="space-y-3.5 select-none">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-md shadow-xl text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-rose-950 border border-rose-800 text-rose-300'
              : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Supplier Directory</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#11221A] text-emerald-300 border border-[#1A402E]">
              {suppliers.length} suppliers
            </span>
            {!canEdit && (
              <span className="badge-warning text-[11px] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Vendor records, delivery lead times, payment terms, and total purchase order volume
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setEditSupplier(null);
              setModal(true);
            }}
            className="btn-primary"
            id="add-supplier-button"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="saas-card p-2.5 flex items-center justify-between gap-3 bg-[#111319]">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            className="form-input pl-8 py-1.5 text-xs"
            placeholder="Search vendor name, code, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-gray-400">
          {suppliers.length} records found
        </div>
      </div>

      {/* Dense Data-First Table Layout */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading suppliers...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-10 text-center">
            <Truck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No supplier records match criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">Code</th>
                  <th className="min-w-[180px]">Supplier & Location</th>
                  <th className="whitespace-nowrap">Key Contact</th>
                  <th className="whitespace-nowrap">Contact Details</th>
                  <th className="whitespace-nowrap text-center">Lead Time</th>
                  <th className="whitespace-nowrap text-center">Payment Terms</th>
                  <th className="whitespace-nowrap text-center">Rating</th>
                  <th className="whitespace-nowrap text-center">Orders</th>
                  <th className="whitespace-nowrap text-right">Procurement Spend</th>
                  {canEdit && <th className="whitespace-nowrap text-right pr-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-emerald-300 bg-[#11221A] px-2 py-0.5 rounded border border-[#1A402E] whitespace-nowrap inline-block">
                        {supplier.code}
                      </span>
                    </td>
                    <td className="min-w-[180px]">
                      <div className="font-medium text-gray-100 text-xs">{supplier.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span>{[supplier.city, supplier.country].filter(Boolean).join(', ') || 'Headquarters'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-xs text-gray-200">
                      {supplier.contactPerson || '—'}
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      <div className="space-y-0.5 text-[11px]">
                        {supplier.email && (
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Mail className="w-3 h-3 text-gray-500" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {!supplier.email && !supplier.phone && <span className="text-gray-500">—</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-center text-xs text-gray-300 tabular-nums">
                      {supplier.leadTimeDays || 7} days
                    </td>
                    <td className="whitespace-nowrap text-center">
                      <span className="text-[11px] font-medium text-gray-300 bg-[#171A22] border border-[#232834] px-2 py-0.5 rounded">
                        {PAYMENT_TERMS[supplier.paymentTerms] || 'Net 30'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-[#78350F] bg-opacity-30 border border-amber-800 border-opacity-50 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{supplier.rating ? supplier.rating.toFixed(1) : '4.0'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-center text-xs font-medium text-gray-200 tabular-nums">
                      {supplier.totalOrders || 0}
                    </td>
                    <td className="whitespace-nowrap text-right text-xs font-semibold text-white tabular-nums">
                      ${Number(supplier.totalSpent || 0).toLocaleString()}
                    </td>
                    {canEdit && (
                      <td className="whitespace-nowrap text-right pr-3">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditSupplier(supplier);
                              setModal(true);
                            }}
                            className="btn-icon"
                            title="Edit supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(supplier)}
                            className="btn-icon text-rose-400 hover:text-rose-300 hover:bg-rose-950 hover:border-rose-800"
                            title="Delete supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {modal && (
        <SupplierModal
          supplier={editSupplier}
          onClose={() => {
            setModal(false);
            setEditSupplier(null);
          }}
          onSubmit={handleSubmit}
          loading={submitLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content max-w-sm p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-white">
                Delete Supplier
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete vendor{' '}
              <span className="text-white font-semibold">{deleteTarget.name}</span> (
              <span className="font-mono text-emerald-400">{deleteTarget.code}</span>)?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget._id, deleteTarget.name)}
                disabled={submitLoading}
                className="btn-danger flex-1"
              >
                {submitLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
