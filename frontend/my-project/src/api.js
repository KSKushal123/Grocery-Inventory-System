import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('[GrocerySys API] Connecting to:', API_URL);

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL
});

// Request interceptor to automatically add the Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Scoped Items endpoints
export const getItems = () => api.get('/items/');
export const createItem = (item) => api.post('/items/', item);
export const updateItem = (id, item) => api.put(`/items/${id}`, item);
export const deleteItem = (id) => api.delete(`/items/${id}`);
export const searchImage = (query) => api.get(`/items/search-image?q=${encodeURIComponent(query)}`);

// Scoped Distributors endpoints
export const getDistributors = () => api.get('/distributors/');
export const createDistributor = (distributor) => api.post('/distributors/', distributor);
export const updateDistributor = (id, distributor) => api.put(`/distributors/${id}`, distributor);
export const deleteDistributor = (id) => api.delete(`/distributors/${id}`);

// Scoped Shops endpoints
export const getShops = () => api.get('/shops/');
export const createShop = (shop) => api.post('/shops/', shop);
export const updateShop = (id, shop) => api.put(`/shops/${id}`, shop);
export const deleteShop = (id) => api.delete(`/shops/${id}`);

// Scoped Business Owners endpoints
export const getBusinessOwners = () => api.get('/business_owners/');
export const createBusinessOwner = (owner) => api.post('/business_owners/', owner);

// Mail Invoice (mocked email, DB stored)
export const mailInvoice = (invoice) => api.post('/mail-invoice/', invoice);

// Scoped Invoices endpoints
export const getInvoices = () => api.get('/invoices/');
export const createInvoice = (invoice) => api.post('/invoices/', invoice);

// Admin User Management endpoints
export const getAdminUsers = () => api.get('/admin/users');
export const approveUser = (email) => api.put(`/admin/users/${email}/approve`);
export const rejectUser = (email) => api.put(`/admin/users/${email}/reject`);
