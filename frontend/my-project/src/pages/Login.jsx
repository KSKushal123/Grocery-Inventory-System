import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Eye, EyeOff, ShoppingCart, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('[GrocerySys Auth API] Connecting to:', API_URL);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your login session has expired. Please sign in again.');
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);



  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      login(res.data.access_token, res.data.user);
      setSuccess('Welcome back! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        token: credentialResponse.credential,
      });
      login(res.data.access_token, res.data.user);
      setSuccess('Logged in with Google successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Google Sign-In was unsuccessful. Please try again.');
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-wrapper">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <ShoppingCart size={28} />
            </div>
            <span className="auth-brand-name">GrocerySys</span>
          </div>
          <div className="auth-left-content">
            <div className="auth-left-badge">
              <Sparkles size={14} />
              <span>Smart Inventory Management</span>
            </div>
            <h1 className="auth-left-title">
              Manage your grocery<br />
              <span className="auth-gradient-text">business smarter</span>
            </h1>
            <p className="auth-left-desc">
              Track inventory, manage distributors, monitor shops, and grow your business — all in one powerful dashboard.
            </p>
            <div className="auth-features">
              {[
                'Real-time inventory tracking',
                'Distributor management',
                'Nearby shop monitoring',
                'Business analytics & insights',
              ].map((feat, i) => (
                <div className="auth-feature-item" key={i}>
                  <CheckCircle size={16} className="auth-feature-icon" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="auth-left-footer">
            Trusted by 500+ grocery businesses across India
          </div>
        </div>

        {/* Right Panel (Auth Card) */}
        <div className="auth-right">
          <div className={`auth-card ${animating ? 'auth-card--exit' : 'auth-card--enter'}`}>
            {/* Header */}
            <div className="auth-card-header">
              <div className="auth-avatar">
                <ShoppingCart size={24} />
              </div>
              <h2 className="auth-card-title">
                Business Owner Portal
              </h2>
              <p className="auth-card-subtitle">
                Secure access for administrators only
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="auth-alert auth-alert--error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-alert auth-alert--success">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleManualSubmit} className="auth-form">

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-forgot">
                <span className="auth-forgot-link">Forgot password?</span>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-text">or continue with</span>
            </div>

            {/* Google Sign In Button */}
            <div className="auth-google-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                theme="filled_blue"
                shape="rectangular"
                width="320"
              />
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
