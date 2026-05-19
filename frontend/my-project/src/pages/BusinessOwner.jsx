import { useState, useEffect } from 'react';
import { User, Phone, Mail, Building, Briefcase, Edit, Save, MapPin, Award, QrCode } from 'lucide-react';

function BusinessOwner() {
  const [owner, setOwner] = useState(() => {
    const saved = localStorage.getItem('inventoryOwnerProfile');
    return saved ? JSON.parse(saved) : {
      name: "Alice Johnson",
      company: "Johnson Retail Group",
      email: "alice@johnsonretail.com",
      phone: "(555) 123-9988",
      address: "123 Business Blvd, Downtown",
      role: "CEO & Founder",
      storesCount: 4,
      status: "Premium Partner",
      upiId: "alice@okaxis"
    };
  });
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem('inventoryOwnerProfile', JSON.stringify(owner));
  }, [owner]);

  const handleEditChange = (field, value) => {
    setOwner(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>My Profile</h1>
        <p>Manage your business owner details</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="btn-icon" 
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: isEditing ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
          title={isEditing ? "Save" : "Edit"}
        >
          {isEditing ? <Save size={20} className="text-primary-color" /> : <Edit size={20} />}
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
          <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '2.5rem', fontWeight: 'bold', flexShrink: 0,
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
            }}>
              {owner.name ? owner.name.substring(0, 2).toUpperCase() : 'BO'}
          </div>
          <div style={{ width: '100%', paddingRight: '3rem' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="text" className="form-control" style={{ fontSize: '1.25rem', fontWeight: 'bold' }} value={owner.name} onChange={e => handleEditChange('name', e.target.value)} placeholder="Full Name" />
                <input type="text" className="form-control" value={owner.role} onChange={e => handleEditChange('role', e.target.value)} placeholder="Role / Title" />
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>{owner.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '1.1rem', fontWeight: '500' }}>
                  <Briefcase size={18} /> {owner.role}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', color: 'var(--text-color)', fontSize: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ color: 'var(--text-color)', fontSize: '1.2rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Contact Info</h3>
            
            {isEditing ? (
              <>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>Email</label><input type="email" className="form-control" value={owner.email} onChange={e => handleEditChange('email', e.target.value)} placeholder="Email" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>Phone</label><input type="text" className="form-control" value={owner.phone} onChange={e => handleEditChange('phone', e.target.value)} placeholder="Phone" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>Address</label><input type="text" className="form-control" value={owner.address} onChange={e => handleEditChange('address', e.target.value)} placeholder="Address" /></div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Mail size={18} style={{ color: '#3b82f6' }} />
                  <span>{owner.email || "N/A"}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Phone size={18} style={{ color: '#3b82f6' }} />
                  <span>{owner.phone || "N/A"}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <MapPin size={18} style={{ marginTop: '0.2rem', color: '#3b82f6' }} />
                  <span>{owner.address || "N/A"}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ color: 'var(--text-color)', fontSize: '1.2rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Business Info</h3>
            
            {isEditing ? (
              <>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>Company</label><input type="text" className="form-control" value={owner.company} onChange={e => handleEditChange('company', e.target.value)} placeholder="Company Name" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>UPI ID for Payments</label><input type="text" className="form-control" value={owner.upiId || ''} onChange={e => handleEditChange('upiId', e.target.value)} placeholder="e.g. alice@okaxis" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>Number of Stores</label><input type="number" className="form-control" value={owner.storesCount} onChange={e => handleEditChange('storesCount', parseInt(e.target.value) || 0)} placeholder="Stores" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#475569' }}>Status</label><input type="text" className="form-control" value={owner.status} onChange={e => handleEditChange('status', e.target.value)} placeholder="Status" /></div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Building size={18} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>{owner.company}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <QrCode size={18} style={{ color: '#3b82f6' }} />
                  <span>UPI ID: <strong style={{ color: 'var(--text-color)' }}>{owner.upiId || "Not Configured"}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    {owner.storesCount} Store{owner.storesCount !== 1 ? 's' : ''} in Network
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#059669' }}>
                  <Award size={18} />
                  <span>{owner.status}</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default BusinessOwner;
