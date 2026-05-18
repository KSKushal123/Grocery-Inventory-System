import { NavLink } from 'react-router-dom';
import { Package, User, Store } from 'lucide-react';

function Navbar() {
  return (
    <nav className="navbar animate-fade-in">
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#f8fafc' }}>
        GrocerySys
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Package size={18} />
          Inventory
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <User size={18} />
          Distributor Profile
        </NavLink>
        <NavLink to="/shops" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Store size={18} />
          Surrounding Shops
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
