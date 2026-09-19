import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  adjustStock: (id, data) => api.post(`/products/${id}/adjust-stock`, data),
};

// ── Warehouses ────────────────────────────────────────────────────────────────
export const warehouseAPI = {
  getAll: () => api.get('/warehouses'),
  getOne: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
  transfer: (data) => api.post('/warehouses/transfer', data),
};

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMovements: (params) => api.get('/analytics/movements', { params }),
  getNotifications: () => api.get('/analytics/notifications'),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  getForecast: (productId, days) => api.get(`/ai/forecast/${productId}`, { params: { days } }),
  getRestockRecommendations: () => api.get('/ai/restock'),
};

export default api;
