import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Inventory from './pages/Inventory';
import DistributorProfile from './pages/DistributorProfile';
import Shops from './pages/Shops';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Inventory />} />
          <Route path="/profile" element={<DistributorProfile />} />
          <Route path="/shops" element={<Shops />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
