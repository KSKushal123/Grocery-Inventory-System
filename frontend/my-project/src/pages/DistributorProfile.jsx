import { useState } from 'react';
import { User, Phone, Mail, MapPin, Star, Truck, Calendar, ShieldCheck, Edit, Save, Plus, Trash2 } from 'lucide-react';

function DistributorProfile() {
  const [distributors, setDistributors] = useState([{
    id: 1,
    name: "FreshFoods Logistics & Distribution",
    contactPerson: "Michael Chen",
    email: "supply@freshfoods.logistics",
    phone: "+1 (555) 123-4567",
    location: "Metro Industrial Park, Hub 4",
    rating: 4.8,
    totalDeliveries: 1240,
    memberSince: "2021",
    status: "Verified Platinum Partner"
  }]);
  const [editingId, setEditingId] = useState(null);

  const recentDeliveries = [
    { id: "DEL-883", date: "Today", items: "Fresh Produce, Dairy", status: "Delivered" },
    { id: "DEL-882", date: "Yesterday", items: "Canned Goods", status: "Delivered" },
    { id: "DEL-879", date: "3 Days Ago", items: "Beverages, Snacks", status: "Delivered" },
  ];

  const handleEditChange = (id, field, value) => {
    setDistributors(distributors.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleDeleteDistributor = (id) => {
    setDistributors(distributors.filter(d => d.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddDistributor = () => {
    const newId = Date.now();
    setDistributors([{
      id: newId,
      name: "New Distributor",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      rating: 0.0,
      totalDeliveries: 0,
      memberSince: new Date().getFullYear().toString(),
      status: "New Partner"
    }, ...distributors]);
    setEditingId(newId);
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
                    onClick={() => setEditingId(isEditing ? null : distributor.id)}
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
                      <span className="badge badge-success">{delivery.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>
            Request New Restock
          </button>
        </div>
      </div>
    </div>
  );
}

export default DistributorProfile;
