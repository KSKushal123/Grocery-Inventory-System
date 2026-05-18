import { NavLink, useNavigate } from 'react-router-dom';
import { Package, User, Store, Users, LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6, #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        }}>
          <ShoppingCart size={16} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          GrocerySys
        </span>
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Package size={18} /> Inventory
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <User size={18} /> Distributors
        </NavLink>
        <NavLink to="/shops" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Store size={18} /> Nearby Shops
        </NavLink>
        <NavLink to="/owners" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} /> Business Owners
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.9rem',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '999px',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 800, color: 'white',
              flexShrink: 0,
            }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || user.email}
            </span>
          </div>
        )}
        <button
          id="navbar-logout-btn"
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
            padding: '0.4rem 0.9rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
