import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supplierAPI } from '../../services/api';

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await supplierAPI.getAll(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createSupplier = createAsyncThunk('suppliers/create', async (data, { rejectWithValue }) => {
  try { const res = await supplierAPI.create(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateSupplier = createAsyncThunk('suppliers/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await supplierAPI.update(id, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id, { rejectWithValue }) => {
  try { await supplierAPI.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState: { items: [], loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => { state.loading = true; })
      .addCase(fetchSuppliers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.suppliers; })
      .addCase(fetchSuppliers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSupplier.fulfilled, (state, action) => { state.items.unshift(action.payload.supplier); })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const idx = state.items.findIndex(s => s._id === action.payload.supplier._id);
        if (idx >= 0) state.items[idx] = action.payload.supplier;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => { state.items = state.items.filter(s => s._id !== action.payload); });
  },
});
export const { clearError } = supplierSlice.actions;
export default supplierSlice.reducer;
