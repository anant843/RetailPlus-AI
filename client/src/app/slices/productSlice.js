import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productAPI } from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await productAPI.getAll(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchLowStock = createAsyncThunk('products/fetchLowStock', async (_, { rejectWithValue }) => {
  try { const res = await productAPI.getLowStock(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createProduct = createAsyncThunk('products/create', async (data, { rejectWithValue }) => {
  try { const res = await productAPI.create(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await productAPI.update(id, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try { await productAPI.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const productSlice = createSlice({
  name: 'products',
  initialState: { items: [], lowStockItems: [], total: 0, loading: false, error: null, selected: null },
  reducers: {
    setSelected: (state, action) => { state.selected = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.products; state.total = action.payload.total; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchLowStock.fulfilled, (state, action) => { state.lowStockItems = action.payload.products; })
      .addCase(createProduct.fulfilled, (state, action) => { state.items.unshift(action.payload.product); })
      .addCase(updateProduct.fulfilled, (state, action) => { const idx = state.items.findIndex(p => p._id === action.payload.product._id); if (idx >= 0) state.items[idx] = action.payload.product; })
      .addCase(deleteProduct.fulfilled, (state, action) => { state.items = state.items.filter(p => p._id !== action.payload); });
  },
});

export const { setSelected, clearError } = productSlice.actions;
export default productSlice.reducer;
