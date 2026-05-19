import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Star, Truck, Calendar, ShieldCheck, Edit, Save, Plus, Trash2, X, Send } from 'lucide-react';
import { getDistributors, createDistributor, updateDistributor, deleteDistributor, getItems } from '../api';

function DistributorProfile() {
  const [distributors, setDistributors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState([
    { id: "DEL-883", date: "Today", items: "Fresh Produce, Dairy", status: "Delivered" },
    { id: "DEL-882", date: "Yesterday", items: "Canned Goods", status: "Delivered" },
    { id: "DEL-879", date: "3 Days Ago", items: "Beverages, Snacks", status: "Delivered" },
  ]);
  const [restockForm, setRestockForm] = useState({
    distributorId: '',
    itemName: '',
    quantity: 10,
    priority: 'Medium',
    notes: ''
  });

  useEffect(() => {
    fetchDistributors();
    fetchInventoryItems();
  }, []);

  const fetchDistributors = async () => {
    try {
      const response = await getDistributors();
      setDistributors(response.data || []);
    } catch (error) {
      console.error("Error fetching distributors:", error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await getItems();
      setInventoryItems(response.data || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const handleOpenRestockModal = () => {
    setIsRestockModalOpen(true);
    setRestockForm({
      distributorId: distributors[0]?.id || '',
      itemName: inventoryItems[0]?.name || 'Produce',
      quantity: 10,
      priority: 'Medium',
      notes: ''
    });
  };

  const handleSendRestockRequest = (e) => {
    e.preventDefault();
    const selectedDistributor = distributors.find(d => d.id === restockForm.distributorId);
    const distName = selectedDistributor ? selectedDistributor.name : "Supplier";
    const itemName = restockForm.itemName;
    
    const newRequest = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      date: "Just Now",
      items: `${itemName} (x${restockForm.quantity})`,
      status: "Requested"
    };
    
    setRecentDeliveries([newRequest, ...recentDeliveries]);
    setIsRestockModalOpen(false);
    alert(`Restock request successfully sent to ${distName} for ${restockForm.quantity}x ${itemName}!`);
  };

  const handleEditChange = (id, field, value) => {
    setDistributors(distributors.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleSave = async (distributor) => {
    try {
      const payload = {
        name: distributor.name || "New Distributor",
        contactPerson: distributor.contactPerson || "",
        email: distributor.email || "",
        phone: distributor.phone || "",
        location: distributor.location || "",
        rating: distributor.rating || 0.0,
        totalDeliveries: distributor.totalDeliveries || 0,
        memberSince: distributor.memberSince || new Date().getFullYear().toString(),
        status: distributor.status || "New Partner"
      };

      if (String(distributor.id).startsWith('temp-')) {
        const response = await createDistributor(payload);
        setDistributors(prev => prev.map(d => d.id === distributor.id ? response.data : d));
      } else {
        const response = await updateDistributor(distributor.id, payload);
        setDistributors(prev => prev.map(d => d.id === distributor.id ? response.data : d));
      }
      setEditingId(null);
    } catch (error) {
      console.error("Error saving distributor:", error);
      alert("Failed to save distributor details. Please try again.");
    }
  };

  const handleDeleteDistributor = async (id) => {
    if (String(id).startsWith('temp-')) {
      setDistributors(distributors.filter(d => d.id !== id));
      if (editingId === id) setEditingId(null);
    } else {
      if (window.confirm("Are you sure you want to delete this distributor?")) {
        try {
          await deleteDistributor(id);
          setDistributors(distributors.filter(d => d.id !== id));
          if (editingId === id) setEditingId(null);
        } catch (error) {
          console.error("Error deleting distributor:", error);
          alert("Failed to delete distributor.");
        }
      }
    }
  };

  const handleAddDistributor = () => {
    const tempId = `temp-${Date.now()}`;
    setDistributors([{
      id: tempId,
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      rating: 0.0,
      totalDeliveries: 0,
      memberSince: new Date().getFullYear().toString(),
      status: "New Partner"
    }, ...distributors]);
    setEditingId(tempId);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Distributor Profiles</h1>
          <p>Details about your stock suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddDistributor}>
          <Plus size={18} /> Add New Distributor
        </button>
      </header>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {distributors.map(distributor => {
            const isEditing = editingId === distributor.id;
            return (
            <div key={distributor.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: '0.25rem' }}>
                  <button 
                    onClick={async () => {
                      if (isEditing) {
                        await handleSave(distributor);
                      } else {
                        setEditingId(distributor.id);
                      }
                    }}
                    className="btn-icon" 
                    title={isEditing ? "Save" : "Edit"}
                  >
                    {isEditing ? <Save size={18} className="text-primary-color" /> : <Edit size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteDistributor(distributor.id)}
                    className="btn-icon" 
                    title="Delete Distributor"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary-color), #34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '2rem', fontWeight: 'bold'
                }}>
                  {distributor.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ paddingRight: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>{distributor.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.9rem', fontWeight: '600' }}>
                    <ShieldCheck size={16} />
                    {distributor.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem', color: 'var(--text-color)', fontSize: '0.95rem' }}>
                {isEditing ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <input type="text" className="form-control" style={{ padding: '0.5rem' }} value={distributor.name} onChange={e => handleEditChange(distributor.id, 'name', e.target.value)} placeholder="Company Name" />
                    <input type="text" className="form-control" style={{ padding: '0.5rem' }} value={distributor.contactPerson} onChange={e => handleEditChange(distributor.id, 'contactPerson', e.target.value)} placeholder="Contact Person" />
                    <input type="text" className="form-control" style={{ padding: '0.5rem' }} value={distributor.email} onChange={e => handleEditChange(distributor.id, 'email', e.target.value)} placeholder="Email" />
                    <input type="text" className="form-control" style={{ padding: '0.5rem' }} value={distributor.phone} onChange={e => handleEditChange(distributor.id, 'phone', e.target.value)} placeholder="Phone" />
                    <input type="text" className="form-control" style={{ padding: '0.5rem' }} value={distributor.location} onChange={e => handleEditChange(distributor.id, 'location', e.target.value)} placeholder="Location" />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <User size={18} className="text-primary-color" />
                      <span><strong>Contact Person:</strong> {distributor.contactPerson || "N/A"}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Mail size={18} className="text-primary-color" />
                      <span>{distributor.email || "N/A"}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Phone size={18} className="text-primary-color" />
                      <span>{distributor.phone || "N/A"}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <MapPin size={18} className="text-primary-color" />
                      <span>{distributor.location || "N/A"}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="stats-container" style={{ marginBottom: 0, marginTop: '1rem' }}>
                <div className="stat-card" style={{ background: 'rgba(15, 23, 42, 0.04)', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', marginBottom: '0.5rem' }}>
                    <Star size={18} fill="currentColor" />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-color)' }}>{distributor.rating}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Supplier Rating</div>
                </div>
                <div className="stat-card" style={{ background: 'rgba(15, 23, 42, 0.04)', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
                    <Truck size={18} />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-color)' }}>{distributor.totalDeliveries}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Total Deliveries</div>
                </div>
              </div>
            </div>

            );
          })}
        </div>

        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} className="text-primary-color" />
            Recent Deliveries
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td style={{ fontWeight: '600' }}>{delivery.id}</td>
                    <td>{delivery.date}</td>
                    <td>{delivery.items}</td>
                    <td>
                      <span className={`badge ${delivery.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`}>
                        {delivery.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '2rem' }}
            onClick={handleOpenRestockModal}
          >
            Request New Restock
          </button>
        </div>
      </div>

      {/* Restock Modal */}
      {isRestockModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: 'var(--glass-shadow)',
            padding: '2rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsRestockModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-color)',
                opacity: 0.7
              }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={22} className="text-primary-color" />
              Request New Restock
            </h2>
            
            <form onSubmit={handleSendRestockRequest}>
              <div className="form-group">
                <label>Select Distributor</label>
                <select 
                  className="form-control" 
                  value={restockForm.distributorId} 
                  onChange={e => setRestockForm({...restockForm, distributorId: e.target.value})}
                  required
                >
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {distributors.length === 0 && (
                    <option value="">No distributors available</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Select Product</label>
                <select 
                  className="form-control" 
                  value={restockForm.itemName} 
                  onChange={e => setRestockForm({...restockForm, itemName: e.target.value})}
                  required
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.name}>{i.name} (₹{i.price})</option>
                  ))}
                  {inventoryItems.length === 0 && (
                    <>
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Dairy & Eggs">Dairy & Eggs</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1" 
                    value={restockForm.quantity} 
                    onChange={e => setRestockForm({...restockForm, quantity: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
                <div>
                  <label>Urgency Level</label>
                  <select 
                    className="form-control" 
                    value={restockForm.priority} 
                    onChange={e => setRestockForm({...restockForm, priority: e.target.value})}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="E.g. Please deliver by tomorrow morning..."
                  value={restockForm.notes} 
                  onChange={e => setRestockForm({...restockForm, notes: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-color)', margin: 0 }} onClick={() => setIsRestockModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Send size={16} /> Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DistributorProfile;
