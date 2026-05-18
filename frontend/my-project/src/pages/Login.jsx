import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Eye, EyeOff, ShoppingCart, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const API_URL = 'http://localhost:8000';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: '#ef4444' },
      { score: 2, label: 'Fair', color: '#f59e0b' },
      { score: 3, label: 'Good', color: '#3b82f6' },
      { score: 4, label: 'Strong', color: '#10b981' },
    ];
    return levels[score];
  };

  const strength = getPasswordStrength(password);

  const switchMode = () => {
    setAnimating(true);
    setError(null);
    setSuccess(null);
    setTimeout(() => {
      setIsRegistering(!isRegistering);
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      setAnimating(false);
    }, 300);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (isRegistering && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        const res = await axios.post(`${API_URL}/auth/register`, { email, password, name });
        login(res.data.access_token, res.data.user);
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        login(res.data.access_token, res.data.user);
        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
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
                {isRegistering ? <User size={24} /> : <ShoppingCart size={24} />}
              </div>
              <h2 className="auth-card-title">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="auth-card-subtitle">
                {isRegistering
                  ? 'Join thousands of grocery business owners'
                  : 'Sign in to your GrocerySys dashboard'}
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
              {isRegistering && (
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-input-icon" />
                    <input
                      id="auth-name"
                      type="text"
                      className="auth-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

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
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
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
                {isRegistering && password && (
                  <div className="auth-strength">
                    <div className="auth-strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="auth-strength-bar"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <span className="auth-strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isRegistering && (
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span className="auth-field-error">Passwords do not match</span>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <span className="auth-field-success">
                      <CheckCircle size={12} /> Passwords match
                    </span>
                  )}
                </div>
              )}

              {!isRegistering && (
                <div className="auth-forgot">
                  <span className="auth-forgot-link">Forgot password?</span>
                </div>
              )}

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
                    <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <p className="auth-switch">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <button
                id="auth-mode-toggle"
                type="button"
                className="auth-switch-btn"
                onClick={switchMode}
              >
                {isRegistering ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
