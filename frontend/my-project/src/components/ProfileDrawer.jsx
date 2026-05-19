import { useState, useEffect } from 'react';
import { Mail, Shield, Calendar, Sun, Globe, LogOut, X, Package, ShoppingCart, Send, Plus, Minus, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../api';
import './ProfileDrawer.css';

function ProfileDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [selectedShopId, setSelectedShopId] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  // Handle Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);



  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchData();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const itemsRes = await api.getItems();
      setItems(itemsRes.data);
      
      const shopsRes = await api.getShops();
      setShops(shopsRes.data);
      if (shopsRes.data.length > 0) {
        setSelectedShopId(shopsRes.data[0].id);
        setPartnerEmail(shopsRes.data[0].contact || `${shopsRes.data[0].name.toLowerCase().replace(/\s+/g, '')}@gmail.com`);
      }
    } catch (error) {
      console.error('Error fetching drawer data:', error);
    }
  };

  const handleShopChange = (shopId) => {
    setSelectedShopId(shopId);
    const shop = shops.find(s => s.id.toString() === shopId.toString());
    if (shop) {
      const email = shop.contact && shop.contact.includes('@') 
        ? shop.contact 
        : `${shop.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
      setPartnerEmail(email);
    }
  };

  const updateCartQty = (itemId, change) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = current + change;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      const item = items.find(i => i.id === itemId);
      if (item && next > item.quantity) {
        return prev; // cannot exceed stock
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleBillInvoice = async (e) => {
    e.preventDefault();
    const cartItems = Object.entries(cart).map(([itemId, qty]) => {
      const item = items.find(i => i.id === itemId);
      return {
        name: item.name,
        quantity: qty,
        price: item.price,
        total: item.price * qty
      };
    });

    if (cartItems.length === 0) return;

    const totalAmount = cartItems.reduce((acc, item) => acc + item.total, 0);
    const selectedShop = shops.find(s => s.id.toString() === selectedShopId.toString()) || { name: 'Unknown Shop' };

    setLoading(true);
    try {
      const res = await api.mailInvoice({
        shop_name: selectedShop.name,
        email: partnerEmail,
        items: cartItems,
        total_amount: totalAmount
      });
      
      setInvoiceSuccess({
        shopName: selectedShop.name,
        email: partnerEmail,
        items: cartItems,
        total: totalAmount
      });
      
      setCart({}); // clear cart
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const cartTotal = Object.entries(cart).reduce((acc, [itemId, qty]) => {
    const item = items.find(i => i.id === itemId);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const totalCartCount = Object.values(cart).reduce((acc, qty) => acc + qty, 0);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container animate-slide-in" onClick={e => e.stopPropagation()}>
        
        {/* Purple Profile Header (Exactly like the User's Image) */}
        <div className="drawer-profile-header">
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
          
          <div className="drawer-avatar-container">
            <div className="drawer-avatar">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AA'}
            </div>
          </div>
          
          <h2 className="drawer-user-name">{user?.name || 'Abhishek AR'}</h2>
          <p className="drawer-user-subtitle">{t('storeManager')}</p>
        </div>

        {/* Profile Content Section */}
        <div className="drawer-scroll-wrapper">
          
          <div className="drawer-section">
            {/* Info Cards (Exactly like the User's Image) */}
            <div className="drawer-info-card">
              <Mail size={18} className="drawer-info-icon" />
              <div className="drawer-info-content">
                <span className="drawer-info-label">{t('email')}</span>
                <span className="drawer-info-value">{user?.email || 'abhishek@gmail.com'}</span>
              </div>
            </div>

            <div className="drawer-info-card">
              <Shield size={18} className="drawer-info-icon" />
              <div className="drawer-info-content">
                <span className="drawer-info-label">{t('role')}</span>
                <span className="drawer-info-value">{t('administrator')}</span>
              </div>
            </div>

            <div className="drawer-info-card">
              <Calendar size={18} className="drawer-info-icon" />
              <div className="drawer-info-content">
                <span className="drawer-info-label">{t('memberSince')}</span>
                <span className="drawer-info-value">May 2026</span>
              </div>
            </div>

            <div className="drawer-info-card drawer-info-card--interactive" onClick={() => setIsDarkMode(!isDarkMode)} style={{ cursor: 'pointer' }}>
              <Sun size={18} className="drawer-info-icon" />
              <div className="drawer-info-content">
                <span className="drawer-info-label">{t('theme')}</span>
                <span className="drawer-info-value">{isDarkMode ? t('darkMode') : t('lightMode')}</span>
              </div>
              <label className="drawer-toggle" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isDarkMode} onChange={(e) => setIsDarkMode(e.target.checked)} />
                <span className="drawer-toggle-slider" />
              </label>
            </div>

            <div className="drawer-info-card drawer-info-card--interactive" onClick={toggleLanguage} style={{ cursor: 'pointer' }}>
              <Globe size={18} className="drawer-info-icon" />
              <div className="drawer-info-content">
                <span className="drawer-info-label">{t('language')}</span>
                <span className="drawer-info-value">{language}</span>
              </div>
            </div>

            <button className="drawer-logout-btn" onClick={logout}>
              <LogOut size={16} />
              {t('logout')}
            </button>
          </div>

          </div>
      </div>
    </div>
  );
}

export default ProfileDrawer;
