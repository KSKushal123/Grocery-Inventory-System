import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Package, User, Store, Users, LogOut, ShoppingCart, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProfileDrawer from './ProfileDrawer';

function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  let pageTitle = 'GrocerySys';
  if (location.pathname === '/') pageTitle = t('inventoryManagement');
  else if (location.pathname === '/profile') pageTitle = t('distributorManagement');
  else if (location.pathname === '/shops') pageTitle = t('nearbyShops');
  else if (location.pathname === '/new-invoice') pageTitle = t('newInvoice');
  else if (location.pathname === '/owners') pageTitle = t('businessOwners');
  else if (location.pathname === '/admin') pageTitle = t('approvals') || 'Approvals';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <ShoppingCart size={16} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            {pageTitle}
          </span>
        </div>

        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Package size={18} /> {t('inventory')}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={18} /> {t('distributors')}
          </NavLink>
          <NavLink to="/shops" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Store size={18} /> {t('nearbyShops')}
          </NavLink>
          <NavLink to="/new-invoice" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} /> {t('newInvoice')}
          </NavLink>
          <NavLink to="/owners" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={18} /> {t('businessOwners')}
          </NavLink>
          {user && user.email === 'kskushal123456@gmail.com' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} /> {t('approvals') || 'Approvals'}
            </NavLink>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <div
              onClick={() => setIsProfileOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.9rem',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '999px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800, color: 'white',
                flexShrink: 0,
              }}>
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email}
              </span>
            </div>
          )}
        </div>
      </nav>
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}

export default Navbar;
