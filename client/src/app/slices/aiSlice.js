import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiAPI } from '../../services/api';

export const sendChatMessage = createAsyncThunk('ai/chat', async ({ message, history }, { rejectWithValue }) => {
  try { const res = await aiAPI.chat({ message, history }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'AI service unavailable'); }
});
export const fetchForecast = createAsyncThunk('ai/forecast', async ({ productId, days }, { rejectWithValue }) => {
  try { const res = await aiAPI.getForecast(productId, days); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchRestockRecommendations = createAsyncThunk('ai/restock', async (_, { rejectWithValue }) => {
  try { const res = await aiAPI.getRestockRecommendations(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    chatHistory: [],
    forecast: null,
    restockRecommendations: [],
    restockTotal: 0,
    chatLoading: false,
    forecastLoading: false,
    restockLoading: false,
    error: null,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.chatHistory.push({ role: 'user', content: action.payload, timestamp: new Date().toISOString() });
    },
    clearChat: (state) => { state.chatHistory = []; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => { state.chatLoading = true; state.error = null; })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.chatHistory.push({ role: 'assistant', content: action.payload.response, timestamp: action.payload.timestamp });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        state.error = action.payload;
        state.chatHistory.push({ role: 'assistant', content: `⚠️ Error: ${action.payload}`, timestamp: new Date().toISOString() });
      })
      .addCase(fetchForecast.pending, (state) => { state.forecastLoading = true; })
      .addCase(fetchForecast.fulfilled, (state, action) => { state.forecastLoading = false; state.forecast = action.payload; })
      .addCase(fetchForecast.rejected, (state, action) => { state.forecastLoading = false; state.error = action.payload; })
      .addCase(fetchRestockRecommendations.pending, (state) => { state.restockLoading = true; })
      .addCase(fetchRestockRecommendations.fulfilled, (state, action) => {
        state.restockLoading = false;
        state.restockRecommendations = action.payload.recommendations;
        state.restockTotal = action.payload.totalCost;
      })
      .addCase(fetchRestockRecommendations.rejected, (state, action) => { state.restockLoading = false; state.error = action.payload; });
  },
});
export const { addUserMessage, clearChat, clearError } = aiSlice.actions;
export default aiSlice.reducer;
