import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../api';
import { Users, Check, X, ShieldAlert, Clock, UserCheck, UserX, Loader, Mail, ShieldCheck } from 'lucide-react';

function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores the email of user undergoing action
  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setFeedback({ type: 'error', message: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email === 'kskushal123456@gmail.com') {
      fetchUsers();
    }
  }, [user]);

  const handleApprove = async (email) => {
    try {
      setActionLoading(email);
      setFeedback(null);
      await api.approveUser(email);
      setFeedback({ type: 'success', message: `User ${email} has been approved successfully!` });
      await fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      setFeedback({ type: 'error', message: `Failed to approve user: ${error.response?.data?.detail || error.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (email) => {
    try {
      setActionLoading(email);
      setFeedback(null);
      await api.rejectUser(email);
      setFeedback({ type: 'success', message: `User ${email} has been rejected.` });
      await fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      setFeedback({ type: 'error', message: `Failed to reject user: ${error.response?.data?.detail || error.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader className="animate-spin text-primary-color" size={48} />
      </div>
    );
  }

  // Check Admin Role
  const isAdmin = user && user.email === 'kskushal123456@gmail.com';
  if (!isAdmin) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', padding: '1rem' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '1.5rem' }}>
            <ShieldAlert size={48} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-color)' }}>
            Access Denied
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
            This section is restricted to the administrator. If you require access, please contact the administrator at <strong style={{ color: 'var(--text-color)' }}>kskushal123456@gmail.com</strong>.
          </p>
          <a href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Go to Inventory
          </a>
        </div>
      </div>
    );
  }

  // Count helper functions
  const totalUsersCount = users.length;
  const pendingUsersCount = users.filter(u => u.status === 'pending').length;
  const approvedUsersCount = users.filter(u => u.status === 'approved').length;
  const rejectedUsersCount = users.filter(u => u.status === 'rejected').length;

  return (
    <>
      <header>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={36} style={{ color: '#10b981' }} />
          {t('approvals') || 'Approvals Portal'}
        </h1>
        <p>Manage access permissions for the Grocery Inventory System</p>
      </header>

      {/* Stats Board */}
      <div className="stats-container animate-fade-in">
        <div className="glass-panel stat-card" style={{ background: '#ffffff' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--primary-color)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Registered</h3>
            <p>{totalUsersCount}</p>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ background: '#ffffff' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending Approvals</h3>
            <p>{pendingUsersCount}</p>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ background: '#ffffff' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>Approved Users</h3>
            <p>{approvedUsersCount}</p>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel" style={{ minHeight: '400px' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} className="text-primary-color" />
            User Management Queue
          </h2>

          {feedback && (
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontWeight: '500',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: feedback.type === 'success' ? '#059669' : '#dc2626',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              {feedback.type === 'success' ? <Check size={18} /> : <X size={18} />}
              {feedback.message}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Loader className="animate-spin text-primary-color" size={32} />
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>System Role</th>
                    <th>Access Status</th>
                    <th style={{ textAlign: 'right' }}>Actions Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                        No registered users found in the database.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isPending = u.status === 'pending';
                      const isApproved = u.status === 'approved';
                      const isRejected = u.status === 'rejected';
                      const isSelf = u.email === user.email;
                      const isTargetActionLoading = actionLoading === u.email;

                      return (
                        <tr key={u.email}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isApproved ? '#10b981' : '#f59e0b'
                              }}>
                                <Mail size={18} />
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-color)', fontSize: '1rem' }}>
                                  {u.email}
                                  {isSelf && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--primary-color)', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>YOU</span>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                  ID: {u.id || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                              {u.role || 'User'}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-badge admin-badge-${u.status || 'pending'}`}>
                              {u.status === 'pending' && <Clock size={12} />}
                              {u.status === 'approved' && <UserCheck size={12} />}
                              {u.status === 'rejected' && <UserX size={12} />}
                              {u.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isSelf ? (
                              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', paddingRight: '0.5rem' }}>
                                Protected Administrator
                              </span>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {isTargetActionLoading ? (
                                  <Loader className="animate-spin text-primary-color" size={20} style={{ marginRight: '1rem' }} />
                                ) : (
                                  <>
                                    {/* Approve Button */}
                                    {(isPending || isRejected) && (
                                      <button
                                        className="btn btn-primary"
                                        style={{
                                          padding: '0.45rem 1rem',
                                          fontSize: '0.85rem',
                                          borderRadius: '8px',
                                          background: 'linear-gradient(135deg, #10b981, #059669)',
                                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                                          margin: 0
                                        }}
                                        onClick={() => handleApprove(u.email)}
                                      >
                                        <Check size={14} />
                                        Approve
                                      </button>
                                    )}

                                    {/* Reject Button */}
                                    {(isPending || isApproved) && (
                                      <button
                                        className="btn btn-danger"
                                        style={{
                                          padding: '0.45rem 1rem',
                                          fontSize: '0.85rem',
                                          borderRadius: '8px',
                                          margin: 0
                                        }}
                                        onClick={() => handleReject(u.email)}
                                      >
                                        <X size={14} />
                                        Reject
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminPanel;
