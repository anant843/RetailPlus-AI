import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderAPI } from '../../services/api';

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await orderAPI.getAll(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createOrder = createAsyncThunk('orders/create', async (data, { rejectWithValue }) => {
  try { const res = await orderAPI.create(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await orderAPI.updateStatus(id, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteOrder = createAsyncThunk('orders/delete', async (id, { rejectWithValue }) => {
  try { await orderAPI.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.orders; state.total = action.payload.total; })
      .addCase(fetchOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createOrder.fulfilled, (state, action) => { state.items.unshift(action.payload.order); })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(o => o._id === action.payload.order._id);
        if (idx >= 0) state.items[idx] = action.payload.order;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => { state.items = state.items.filter(o => o._id !== action.payload); });
  },
});
export const { clearError } = orderSlice.actions;
export default orderSlice.reducer;
