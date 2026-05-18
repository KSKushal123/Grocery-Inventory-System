import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit, DollarSign, Archive, BarChart2 } from 'lucide-react';
import * as api from './api';
import './index.css';

function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', quantity: 0, price: 0 });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await api.getItems();
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateItem(editingId, formData);
        setEditingId(null);
      } else {
        await api.createItem(formData);
      }
      setFormData({ name: '', description: '', quantity: 0, price: 0 });
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      price: item.price
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteItem(id);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app-container">
      <header>
        <h1>Grocery Inventory</h1>
        <p>Manage your store's stock with elegance</p>
      </header>

      <div className="stats-container animate-fade-in">
        <div className="glass-panel stat-card">
          <div className="stat-icon"><Package size={24} /></div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <p>{items.length}</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon"><Archive size={24} /></div>
          <div className="stat-info">
            <h3>Total Items in Stock</h3>
            <p>{totalItems}</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-info">
            <h3>Total Inventory Value</h3>
            <p>${totalValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingId ? <Edit size={20} className="text-primary-color" /> : <Plus size={20} className="text-primary-color" />}
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="e.g. Organic Apples"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                placeholder="Brief details about the product..."
              />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                />
              </div>
              <div>
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  required
                  min="0"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '', quantity: 0, price: 0 });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={20} />
            Current Inventory
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No items in inventory. Add some products to get started!
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.description}</div>
                      </td>
                      <td>
                        {item.quantity > 20 ? (
                          <span className="badge badge-success">In Stock</span>
                        ) : item.quantity > 0 ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-danger">Out of Stock</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">
                            <Edit size={18} />
                          </button>
                          <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDelete(item.id)} title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
