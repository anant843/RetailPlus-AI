import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import warehouseReducer from './slices/warehouseSlice';
import supplierReducer from './slices/supplierSlice';
import orderReducer from './slices/orderSlice';
import analyticsReducer from './slices/analyticsSlice';
import aiReducer from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    warehouses: warehouseReducer,
    suppliers: supplierReducer,
    orders: orderReducer,
    analytics: analyticsReducer,
    ai: aiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
