import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const getItems = () => axios.get(`${API_URL}/items/`);
export const createItem = (item) => axios.post(`${API_URL}/items/`, item);
export const updateItem = (id, item) => axios.put(`${API_URL}/items/${id}`, item);
export const deleteItem = (id) => axios.delete(`${API_URL}/items/${id}`);

export const getDistributors = () => axios.get(`${API_URL}/distributors/`);
export const createDistributor = (distributor) => axios.post(`${API_URL}/distributors/`, distributor);

export const getShops = () => axios.get(`${API_URL}/shops/`);
export const createShop = (shop) => axios.post(`${API_URL}/shops/`, shop);

export const getBusinessOwners = () => axios.get(`${API_URL}/business_owners/`);
export const createBusinessOwner = (owner) => axios.post(`${API_URL}/business_owners/`, owner);
