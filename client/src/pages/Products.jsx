import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../app/slices/productSlice';
import { fetchWarehouses } from '../app/slices/warehouseSlice';
import { fetchSuppliers } from '../app/slices/supplierSlice';
import {
  Plus, Search, Edit2, Trash2, Package, AlertTriangle, X,
  Download, CheckSquare, Square, MinusSquare, AlertCircle, CheckCircle2,
  Lock, ArrowUpDown, Filter
} from 'lucide-react';

const CATEGORIES = [
  'Electronics', 'Apparel', 'Home & Kitchen', 'Health & Beauty',
  'Sports', 'Food & Beverage', 'Office Supplies', 'Automotive', 'Toys', 'Other'
];

const getStockStatus = (product) => {
  if (product.totalStock <= 0) return 'out_of_stock';
  if (product.totalStock <= product.minStockLevel) return 'low_stock';
  if (product.totalStock <= product.reorderPoint) return 'reorder_needed';
  return 'in_stock';
};

const ProductModal = ({ product, warehouses, suppliers, onClose, onSubmit, loading, error }) => {
  const isEdit = !!product;
  const [form, setForm] = useState(
    product || {
      sku: '',
      name: '',
      category: 'Electronics',
      brand: '',
      unit: 'piece',
      costPrice: '',
      sellingPrice: '',
      minStockLevel: 10,
      reorderPoint: 20,
      reorderQuantity: 50,
      supplier: '',
      description: '',
      barcode: '',
      warehouseStock:
        warehouses && warehouses.length > 0
          ? warehouses.slice(0, 1).map((w) => ({ warehouse: w._id, quantity: 0, aisle: '', bin: '' }))
          : [],
    }
  );

  const handleWHChange = (idx, field, value) => {
    const ws = [...(form.warehouseStock || [])];
    ws[idx] = { ...ws[idx], [field]: value };
    setForm({ ...form, warehouseStock: ws });
  };

  const addWarehouse = () => {
    const used = (form.warehouseStock || []).map((ws) => ws.warehouse);
    const avail = warehouses.find((w) => !used.includes(w._id));
    if (avail) {
      setForm({
        ...form,
        warehouseStock: [...(form.warehouseStock || []), { warehouse: avail._id, quantity: 0, aisle: '', bin: '' }],
      });
    }
  };

  const removeWH = (idx) => {
    const ws = [...(form.warehouseStock || [])];
    ws.splice(idx, 1);
    setForm({ ...form, warehouseStock: ws });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanForm = {
      ...form,
      sku: (form.sku || '').trim().toUpperCase(),
      name: (form.name || '').trim(),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      minStockLevel: Number(form.minStockLevel) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      reorderQuantity: Number(form.reorderQuantity) || 0,
      supplier: form.supplier && typeof form.supplier === 'string' && form.supplier.trim() !== '' ? form.supplier.trim() : undefined,
      warehouseStock: (form.warehouseStock || [])
        .filter((ws) => ws.warehouse && ws.warehouse.toString().trim() !== '')
        .map((ws) => ({
          warehouse: ws.warehouse,
          quantity: Number(ws.quantity) || 0,
          aisle: (ws.aisle || '').trim(),
          bin: (ws.bin || '').trim(),
        })),
    };
    onSubmit(cleanForm);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E232E] bg-[#0E1015]">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              {isEdit ? `Edit Product: ${product?.sku}` : 'Add New Inventory SKU'}
            </h2>
            <p className="text-[10px] text-gray-500 font-mono">Commercial product registry & warehouse allocation</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-2.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">SKU Identifier *</label>
              <input
                className="form-input font-mono uppercase"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. ELEC-1001"
                required
              />
            </div>
            <div>
              <label className="form-label">Barcode / UPC</label>
              <input
                className="form-input font-mono"
                value={form.barcode || ''}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="07935731892"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Product Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mechanical Gaming Keyboard"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Brand</label>
              <input
                className="form-input"
                value={form.brand || ''}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Logitech"
              />
            </div>
            <div>
              <label className="form-label">Unit of Measure</label>
              <select
                className="form-select"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {['piece', 'kg', 'liter', 'box', 'pack', 'set'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Unit Cost Price ($) *</label>
              <input
                type="number"
                className="form-input font-mono"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="form-label">Unit Selling Price ($) *</label>
              <input
                type="number"
                className="form-input font-mono"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Min Stock Threshold</label>
              <input
                type="number"
                className="form-input font-mono"
                value={form.minStockLevel}
                onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label className="form-label">Reorder Trigger Point</label>
              <input
                type="number"
                className="form-input font-mono"
                value={form.reorderPoint}
                onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label className="form-label">Standard Reorder Qty</label>
              <input
                type="number"
                className="form-input font-mono"
                value={form.reorderQuantity}
                onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Primary Vendor / Supplier</label>
            <select
              className="form-select"
              value={form.supplier || ''}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            >
              <option value="">— Select Vendor —</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code || 'SUP'})</option>
              ))}
            </select>
          </div>

          {/* Warehouse Stock Allocation */}
          <div className="pt-2 border-t border-[#1E232E]">
            <div className="flex items-center justify-between mb-2">
              <label className="form-label m-0">Warehouse Facility Inventory</label>
              <button
                type="button"
                onClick={addWarehouse}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                <Plus className="w-3 h-3" /> Add Facility
              </button>
            </div>
            <div className="space-y-1.5">
              {(form.warehouseStock || []).map((ws, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 p-2 rounded bg-[#0E1015] border border-[#1E232E]">
                  <div className="col-span-2">
                    <select
                      className="form-select py-1 text-xs"
                      value={ws.warehouse}
                      onChange={(e) => handleWHChange(idx, 'warehouse', e.target.value)}
                    >
                      {warehouses.map((w) => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input py-1 text-xs font-mono"
                      placeholder="Qty"
                      value={ws.quantity}
                      onChange={(e) => handleWHChange(idx, 'quantity', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div>
                    <input
                      className="form-input py-1 text-xs font-mono"
                      placeholder="Aisle"
                      value={ws.aisle || ''}
                      onChange={(e) => handleWHChange(idx, 'aisle', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1 col-span-2">
                    <input
                      className="form-input py-1 text-xs font-mono flex-1"
                      placeholder="Bin"
                      value={ws.bin || ''}
                      onChange={(e) => handleWHChange(idx, 'bin', e.target.value)}
                    />
                    {(form.warehouseStock || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWH(idx)}
                        className="text-gray-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#1E232E]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Products = () => {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((s) => s.products);
  const { items: warehouses } = useSelector((s) => s.warehouses);
  const { items: suppliers } = useSelector((s) => s.suppliers);
  const { user } = useSelector((s) => s.auth);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(
      fetchProducts({
        search,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
      })
    );
  };

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [search, category, status]);

  const canEdit = ['admin', 'manager'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  // Selection handlers
  const isAllSelected = products.length > 0 && selectedIds.size === products.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < products.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p._id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const exportSelectedCSV = () => {
    const targetProducts = selectedIds.size > 0
      ? products.filter((p) => selectedIds.has(p._id))
      : products;

    if (targetProducts.length === 0) return;

    const headers = ['SKU', 'Name', 'Category', 'Brand', 'CostPrice', 'SellingPrice', 'Stock', 'MinStock', 'ReorderPoint', 'Supplier'];
    const rows = targetProducts.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.brand || '',
      p.costPrice,
      p.sellingPrice,
      p.totalStock,
      p.minStockLevel,
      p.reorderPoint,
      p.supplier?.name || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', msg: `Exported ${targetProducts.length} products to CSV.` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (form) => {
    setSubmitLoading(true);
    setModalError(null);
    try {
      if (editProduct) {
        await dispatch(updateProduct({ id: editProduct._id, data: form })).unwrap();
        setToast({ type: 'success', msg: `Product ${form.sku} updated.` });
      } else {
        await dispatch(createProduct(form)).unwrap();
        setToast({ type: 'success', msg: `SKU ${form.sku} registered successfully.` });
      }
      setSubmitLoading(false);
      setModalOpen(false);
      setEditProduct(null);
      setTimeout(() => setToast(null), 3500);
      dispatch(fetchProducts());
    } catch (err) {
      setSubmitLoading(false);
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to save product.';
      setModalError(msg);
    }
  };

  const confirmSingleDelete = async (id, name) => {
    setSubmitLoading(true);
    try {
      await dispatch(deleteProduct(id)).unwrap();
      setDeleteTarget(null);
      setSubmitLoading(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setToast({ type: 'success', msg: `Product "${name}" deleted.` });
      setTimeout(() => setToast(null), 3500);
      dispatch(fetchProducts());
    } catch (err) {
      setSubmitLoading(false);
      setToast({ type: 'error', msg: typeof err === 'string' ? err : 'Failed to delete.' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const confirmBulkDelete = async () => {
    setSubmitLoading(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        successCount++;
      } catch (e) {
        // continue deletion
      }
    }
    setSubmitLoading(false);
    setBulkDeleteConfirm(false);
    setSelectedIds(new Set());
    setToast({ type: 'success', msg: `Deleted ${successCount} products from database.` });
    setTimeout(() => setToast(null), 3500);
    dispatch(fetchProducts());
  };

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Item Master & Stock Ledger</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171A22] text-gray-400 border border-[#232834]">
              {products.length} active SKUs
            </span>
            {!canEdit && (
              <span className="badge-warning text-[11px] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Master item directory with safety stock thresholds, supplier records, and warehouse allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSelectedCSV}
            className="btn-secondary"
            title="Download CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setEditProduct(null);
                setModalError(null);
                setModalOpen(true);
              }}
              className="btn-primary"
              id="add-product-button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Sticky Filter Toolbar */}
      <div className="saas-card p-2.5 flex flex-wrap items-center justify-between gap-2.5 bg-[#111319]">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="form-input pl-8 py-1.5 text-xs"
              placeholder="Filter by SKU, name, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="product-search"
            />
          </div>

          <select
            className="form-select w-40 py-1.5 text-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="form-select w-36 py-1.5 text-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {(search || category !== 'all' || status !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
                setStatus('all');
              }}
              className="text-[11px] text-gray-400 hover:text-white px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-gray-400">
          Showing {products.length} records
        </div>
      </div>

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedIds.size > 0 && (
        <div className="saas-card px-3.5 py-2 flex items-center justify-between gap-3 bg-[#111F18] border-emerald-900 border-opacity-70 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-white">
              {selectedIds.size} of {products.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportSelectedCSV}
              className="btn-secondary py-1 text-xs"
            >
              <Download className="w-3 h-3" />
              <span>Export Selected</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="btn-danger py-1 text-xs"
                id="bulk-delete-button"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1 rounded text-gray-400 hover:text-white"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Table-First Products Grid */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading item records...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No inventory products match criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="w-8 text-center px-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-white inline-flex items-center justify-center"
                      title="Select all"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="whitespace-nowrap">SKU</th>
                  <th className="min-w-[150px]">Product Details</th>
                  <th className="whitespace-nowrap">Category</th>
                  <th className="whitespace-nowrap text-right">Cost</th>
                  <th className="whitespace-nowrap text-right">Price</th>
                  <th className="whitespace-nowrap text-center">Margin</th>
                  <th className="whitespace-nowrap text-center">Stock / Min</th>
                  <th className="whitespace-nowrap text-center">Status</th>
                  <th className="whitespace-nowrap">Supplier</th>
                  {canEdit && <th className="whitespace-nowrap text-right pr-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stockStatus = getStockStatus(p);
                  const isSelected = selectedIds.has(p._id);
                  const margin =
                    p.sellingPrice > 0
                      ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                      : 0;

                  return (
                    <tr
                      key={p._id}
                      className={isSelected ? 'bg-[#11231C]' : ''}
                    >
                      <td className="w-8 text-center px-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(p._id)}
                          className="text-gray-400 hover:text-white inline-flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-200 bg-[#1C202A] px-2 py-0.5 rounded border border-[#2B3242] whitespace-nowrap inline-block">
                          {p.sku}
                        </span>
                      </td>
                      <td className="min-w-[150px] max-w-[220px]">
                        <p className="font-medium text-gray-100 truncate text-xs" title={p.name}>{p.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.brand || 'No brand'}</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="text-gray-300 text-xs">{p.category}</span>
                      </td>
                      <td className="whitespace-nowrap text-right text-gray-400 text-xs tabular-nums">
                        ${Number(p.costPrice).toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap text-right font-medium text-gray-200 text-xs tabular-nums">
                        ${Number(p.sellingPrice).toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap text-center">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap inline-block tabular-nums ${
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
                      <td className="whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center gap-1 text-xs tabular-nums">
                          {p.totalStock <= p.minStockLevel && (
                            <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-white">{p.totalStock}</span>
                          <span className="text-gray-400 text-[11px]">/ {p.reorderPoint}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-center">
                        {stockStatus === 'in_stock' && <span className="badge-success">In stock</span>}
                        {stockStatus === 'low_stock' && <span className="badge-warning">Low stock</span>}
                        {stockStatus === 'reorder_needed' && <span className="badge-info">Reorder</span>}
                        {stockStatus === 'out_of_stock' && <span className="badge-danger">Out of stock</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="text-xs text-gray-400 truncate max-w-[130px] block" title={p.supplier?.name || ''}>
                          {p.supplier?.name || '—'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="whitespace-nowrap text-right pr-3">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditProduct(p);
                                setModalError(null);
                                setModalOpen(true);
                              }}
                              className="btn-icon"
                              title="Edit SKU"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="btn-icon text-rose-400 hover:text-rose-300 hover:bg-rose-950 hover:border-rose-800"
                              title="Delete SKU"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal (Create / Edit) */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          warehouses={warehouses}
          suppliers={suppliers}
          onClose={() => {
            setModalOpen(false);
            setEditProduct(null);
            setModalError(null);
          }}
          onSubmit={handleModalSubmit}
          loading={submitLoading}
          error={modalError}
        />
      )}

      {/* Delete Single Product Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content max-w-sm p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-white">
                Delete Product SKU
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete SKU{' '}
              <span className="text-white font-semibold font-mono">{deleteTarget.sku}</span> (
              {deleteTarget.name})? This cannot be undone.
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
                onClick={() => confirmSingleDelete(deleteTarget._id, deleteTarget.name)}
                disabled={submitLoading}
                className="btn-danger flex-1"
                id="confirm-delete-button"
              >
                {submitLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="modal-content max-w-sm p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-white">
                Bulk Delete Confirmation
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="text-white font-semibold font-mono">{selectedIds.size}</span> selected products?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                disabled={submitLoading}
                className="btn-danger flex-1"
                id="confirm-bulk-delete-button"
              >
                {submitLoading ? 'Deleting...' : `Delete ${selectedIds.size} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
