import { useState, useEffect } from 'react';
import { Store, Map, Navigation, Phone, ExternalLink, Edit, Save, Plus, Trash2 } from 'lucide-react';
import { getShops, createShop, updateShop, deleteShop } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

function Shops() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user && user.email === 'kskushal123456@gmail.com';
  const [shops, setShops] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [shopToDelete, setShopToDelete] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await getShops();
      setShops(response.data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const handleEditChange = (id, field, value) => {
    setShops(shops.map(shop => shop.id === id ? { ...shop, [field]: value } : shop));
  };

  const handleSave = async (shop) => {
    try {
      const payload = {
        name: shop.name || "New Shop",
        distance: shop.distance || "",
        address: shop.address || "",
        type: shop.type || "New Store",
        status: shop.status || "Unknown",
        contact: shop.contact || ""
      };

      if (String(shop.id).startsWith('temp-')) {
        const response = await createShop(payload);
        setShops(prev => prev.map(s => s.id === shop.id ? response.data : s));
      } else {
        const response = await updateShop(shop.id, payload);
        setShops(prev => prev.map(s => s.id === shop.id ? response.data : s));
      }
      setEditingId(null);
    } catch (error) {
      console.error("Error saving shop:", error);
      const errMsg = error.response?.data?.detail || "Failed to save shop details. Please try again.";
      alert(errMsg);
    }
  };

  const handleDeleteShop = (id) => {
    if (String(id).startsWith('temp-')) {
      setShops(shops.filter(shop => shop.id !== id));
      if (editingId === id) setEditingId(null);
    } else {
      const shop = shops.find(s => s.id === id);
      if (shop) {
        setShopToDelete(shop);
      }
    }
  };

  const handleAddShop = () => {
    const tempId = `temp-${Date.now()}`;
    setShops([{
      id: tempId,
      name: "",
      distance: "",
      address: "",
      type: "New Store",
      status: "Unknown",
      contact: ""
    }, ...shops]);
    setEditingId(tempId);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Surrounding Shops</h1>
          <p>Partner stores and competitors in your district</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddShop}>
          <Plus size={18} /> Add New Shop
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {shops.map(shop => {
          const isEditing = editingId === shop.id;
          return (
          <div key={shop.id} className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.3s ease', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={async () => {
                  if (isEditing) {
                    await handleSave(shop);
                  } else {
                    setEditingId(shop.id);
                  }
                }}
                className="btn-icon" 
                title={isEditing ? "Save" : "Edit"}
              >
                {isEditing ? <Save size={16} className="text-primary-color" /> : <Edit size={16} />}
              </button>
              {isAdmin && (
                <button 
                  onClick={() => handleDeleteShop(shop.id)}
                  className="btn-icon" 
                  title="Delete Shop"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '4rem' }}>
              <div style={{ width: '100%' }}>
                {isEditing ? (
                  <input type="text" className="form-control" style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }} value={shop.name} onChange={e => handleEditChange(shop.id, 'name', e.target.value)} placeholder="Shop Name" />
                ) : (
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={20} className="text-primary-color" />
                    {shop.name}
                  </h3>
                )}
                {isEditing ? (
                  <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={shop.type} onChange={e => handleEditChange(shop.id, 'type', e.target.value)} placeholder="Type" />
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{shop.type}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-color)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {isEditing ? (
                <>
                  <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={shop.address} onChange={e => handleEditChange(shop.id, 'address', e.target.value)} placeholder="Address" />
                  <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={shop.contact} onChange={e => handleEditChange(shop.id, 'contact', e.target.value)} placeholder="Contact" />
                  <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={shop.distance} onChange={e => handleEditChange(shop.id, 'distance', e.target.value)} placeholder="Distance" />
                  <input type="text" className="form-control" style={{ padding: '0.25rem 0.5rem' }} value={shop.status} onChange={e => handleEditChange(shop.id, 'status', e.target.value)} placeholder="Status" />
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Map size={16} style={{ marginTop: '0.2rem', color: '#64748b' }} />
                    <span>{shop.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Phone size={16} style={{ color: '#64748b' }} />
                    <span>{shop.contact}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#059669', fontWeight: 'bold' }}>
                    <Navigation size={16} style={{ color: '#64748b' }} />
                    <span>{shop.distance} away</span>
                  </div>
                </>
              )}
            </div>

            {!isEditing && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: shop.status.includes('Open') ? '#059669' : '#64748b', fontWeight: '600' }}>
                  {shop.status}
                </span>
                <button 
                  className="btn-icon" 
                  title="Get Directions" 
                  style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}
                  onClick={() => {
                    const destination = shop.address ? `${shop.name}, ${shop.address}` : shop.name;
                    window.open(`https://www.google.com/maps/dir/Mandya/${encodeURIComponent(destination)}`, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Navigation size={16} />
                </button>
              </div>
            )}

          </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <Map size={48} style={{ margin: '0 auto 1rem', color: '#3b82f6', opacity: 0.8 }} />
        <h2 style={{ marginBottom: '1rem' }}>Interactive District Map</h2>
        <p style={{ color: '#475569', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          View real-time inventory sharing status, competitor pricing, and optimized delivery routes in your district.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => window.open('https://www.google.com/maps/dir/Mandya/Malavalli', '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink size={18} />
          Open District Map
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(shopToDelete)}
        onClose={() => setShopToDelete(null)}
        onConfirm={async () => {
          if (!shopToDelete) return;
          try {
            await deleteShop(shopToDelete.id);
            setShops(shops.filter(shop => shop.id !== shopToDelete.id));
            if (editingId === shopToDelete.id) setEditingId(null);
            setShopToDelete(null);
          } catch (error) {
            console.error("Error deleting shop:", error);
            alert("Failed to delete shop.");
          }
        }}
        title={t('confirmDelete')}
        message="Are you sure you want to delete this shop? This action cannot be undone."
        itemName={shopToDelete ? shopToDelete.name : ''}
        itemDetails={shopToDelete ? `${shopToDelete.type} • ${shopToDelete.distance} away` : ''}
        icon={Store}
      />
    </div>
  );
}

export default Shops;
