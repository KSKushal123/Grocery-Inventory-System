import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit, DollarSign, Archive, BarChart2, User, MapPin, Mail, Phone, Award, Search, Filter, Tag, Upload } from 'lucide-react';
import * as api from '../api';

function Inventory() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'Produce', quantity: 0, price: 0, image: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const CATEGORIES = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 'Pantry', 'Beverages', 'Snacks', 'Other'];
  const [editingId, setEditingId] = useState(null);

  const [ownerProfile, setOwnerProfile] = useState(() => {
    const saved = localStorage.getItem('inventoryOwnerProfile');
    return saved ? JSON.parse(saved) : {
      name: "Alice Johnson",
      company: "Johnson Retail Group",
      email: "alice@johnsonretail.com",
      phone: "(555) 123-9988",
      address: "123 Business Blvd, Downtown",
      role: "CEO & Founder",
      storesCount: 4,
      status: "Premium Partner"
    };
  });
  const [isEditingOwner, setIsEditingOwner] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('inventoryOwnerProfile', JSON.stringify(ownerProfile));
  }, [ownerProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateItem(editingId, formData);
        setEditingId(null);
      } else {
        await api.createItem(formData);
      }
      setFormData({ name: '', description: '', category: 'Produce', quantity: 0, price: 0, image: '' });
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || 'Produce',
      quantity: item.quantity,
      price: item.price,
      image: item.image || ''
    });
    setEditingId(item.id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    
    let matchesStatus = true;
    if (filterStatus === 'In Stock') matchesStatus = item.quantity > 20;
    if (filterStatus === 'Low Stock') matchesStatus = item.quantity > 0 && item.quantity <= 20;
    if (filterStatus === 'Out of Stock') matchesStatus = item.quantity === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '2.5rem' }}>Inventory Management</h1>
          <p>Manage your store's stock with elegance</p>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 2rem', margin: '0', position: 'relative' }}>
          <button 
            onClick={() => setIsEditingOwner(!isEditingOwner)}
            className="btn-icon" 
            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
            title={isEditingOwner ? "Save" : "Edit Profile"}
          >
            <Edit size={16} className={isEditingOwner ? "text-primary-color" : ""} />
          </button>
          
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary-color), #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            flexShrink: 0
          }}>
            {ownerProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'O'}
          </div>
          
          {isEditingOwner ? (
            <div style={{ display: 'grid', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
              <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={ownerProfile.name} onChange={e => setOwnerProfile({...ownerProfile, name: e.target.value})} placeholder="Name" />
              <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={ownerProfile.role} onChange={e => setOwnerProfile({...ownerProfile, role: e.target.value})} placeholder="Role" />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={ownerProfile.email} onChange={e => setOwnerProfile({...ownerProfile, email: e.target.value})} placeholder="Email" />
                <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={ownerProfile.phone} onChange={e => setOwnerProfile({...ownerProfile, phone: e.target.value})} placeholder="Phone" />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
                {ownerProfile.name} <Award size={18} style={{ color: '#3b82f6' }} />
              </h2>
              <div style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                {ownerProfile.role}
              </div>
              <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={12} /> {ownerProfile.email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12} /> {ownerProfile.phone}</span>
              </div>
            </div>
          )}
        </div>
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
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Category</label>
                <select 
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label>Description</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="1"
                  placeholder="Brief details..."
                />
              </div>
            </div>
            <div className="form-group">
              <label>Image (URL or Local File)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, margin: 0 }}
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="https://example.com/image.jpg or paste base64"
                  />
                  <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, padding: '0.5rem 1rem', background: '#334155', borderRadius: '8px', color: '#f8fafc', border: '1px solid #475569', whiteSpace: 'nowrap' }}>
                    <Upload size={18} />
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {formData.image && (
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569', flexShrink: 0, backgroundColor: '#334155' }}>
                    <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
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
                  setFormData({ name: '', description: '', category: 'Produce', quantity: 0, price: 0, image: '' });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BarChart2 size={20} />
              Current Inventory
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', minWidth: '200px', margin: 0 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="form-control" 
                style={{ minWidth: '150px', margin: 0 }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select 
                className="form-control" 
                style={{ minWidth: '150px', margin: 0 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Image</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      {items.length === 0 ? 'No items in inventory. Add some products to get started!' : 'No items match your search/filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={24} style={{ color: '#94a3b8' }} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '500', fontSize: '1.05rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <Tag size={12} /> {item.category || 'Uncategorized'} &bull; {item.description}
                        </div>
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
    </>
  );
}

export default Inventory;
