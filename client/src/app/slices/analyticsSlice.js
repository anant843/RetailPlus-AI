import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

export const fetchDashboard = createAsyncThunk('analytics/fetchDashboard', async (_, { rejectWithValue }) => {
  try { const res = await analyticsAPI.getDashboard(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchMovements = createAsyncThunk('analytics/fetchMovements', async (params, { rejectWithValue }) => {
  try { const res = await analyticsAPI.getMovements(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchNotifications = createAsyncThunk('analytics/fetchNotifications', async (_, { rejectWithValue }) => {
  try { const res = await analyticsAPI.getNotifications(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    kpis: null, categoryDistribution: [], monthlyChart: [], topProducts: [],
    recentMovements: [], pendingOrders: [], warehouses: [],
    movements: [], movementsTotal: 0,
    notifications: [], unreadCount: 0,
    loading: false, error: null
  },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload.kpis;
        state.categoryDistribution = action.payload.categoryDistribution;
        state.monthlyChart = action.payload.monthlyChart;
        state.topProducts = action.payload.topProducts;
        state.recentMovements = action.payload.recentMovements;
        state.pendingOrders = action.payload.pendingOrders;
        state.warehouses = action.payload.warehouses;
      })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMovements.fulfilled, (state, action) => { state.movements = action.payload.movements; state.movementsTotal = action.payload.total; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.notifications.filter(n => !n.isRead).length;
      });
  },
});
export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
