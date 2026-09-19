import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseAPI } from '../../services/api';

export const fetchWarehouses = createAsyncThunk('warehouses/fetchAll', async (_, { rejectWithValue }) => {
  try { const res = await warehouseAPI.getAll(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchWarehouse = createAsyncThunk('warehouses/fetchOne', async (id, { rejectWithValue }) => {
  try { const res = await warehouseAPI.getOne(id); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createWarehouse = createAsyncThunk('warehouses/create', async (data, { rejectWithValue }) => {
  try { const res = await warehouseAPI.create(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateWarehouse = createAsyncThunk('warehouses/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await warehouseAPI.update(id, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const transferStock = createAsyncThunk('warehouses/transfer', async (data, { rejectWithValue }) => {
  try { const res = await warehouseAPI.transfer(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const warehouseSlice = createSlice({
  name: 'warehouses',
  initialState: { items: [], selected: null, loading: false, error: null, transferLoading: false },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => { state.loading = true; })
      .addCase(fetchWarehouses.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.warehouses; })
      .addCase(fetchWarehouses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchWarehouse.fulfilled, (state, action) => { state.selected = action.payload; })
      .addCase(createWarehouse.fulfilled, (state, action) => { state.items.push(action.payload.warehouse); })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        const idx = state.items.findIndex(w => w._id === action.payload.warehouse._id);
        if (idx >= 0) state.items[idx] = action.payload.warehouse;
      })
      .addCase(transferStock.pending, (state) => { state.transferLoading = true; })
      .addCase(transferStock.fulfilled, (state) => { state.transferLoading = false; })
      .addCase(transferStock.rejected, (state, action) => { state.transferLoading = false; state.error = action.payload; });
  },
});
export const { clearError } = warehouseSlice.actions;
export default warehouseSlice.reducer;
