import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Inventory from './pages/Inventory';
import DistributorProfile from './pages/DistributorProfile';
import Shops from './pages/Shops';
import BusinessOwner from './pages/BusinessOwner';
import NewInvoice from './pages/NewInvoice';
import Login from './pages/Login';
import './index.css';


// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060b18',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(59,130,246,0.3)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

// Public route — redirects authenticated users away from login
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
}

function AppLayout() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DistributorProfile /></ProtectedRoute>} />
        <Route path="/shops" element={<ProtectedRoute><Shops /></ProtectedRoute>} />
        <Route path="/new-invoice" element={<ProtectedRoute><NewInvoice /></ProtectedRoute>} />
        <Route path="/owners" element={<ProtectedRoute><BusinessOwner /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
