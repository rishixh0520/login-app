import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Lock, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ text: 'Passwords do not match', type: 'error' });
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      setMessage({ text: res.data.message, type: 'success' });
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to reset password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '400px', margin: '40px auto', padding: '40px' }}>
        {success ? (
          <div className="fp-success-state" style={{ textAlign: 'center' }}>
            <div className="fp-success-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#10b981' }}>
              <CheckCircle size={48} />
            </div>
            <h2>Password Reset Successful</h2>
            <p>Your password has been changed successfully. Redirecting to login...</p>
            <button className="btn-primary w-full" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2>Create New Password</h2>
              <p className="auth-subtitle">Enter your new password below</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label>New Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="input-icon-wrap" style={{ flex: 1 }}>
                    <Lock size={16} className="input-icon" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                  <button type="button" className="pw-toggle-btn" onClick={() => setShowPassword(!showPassword)} title="Toggle Password Visibility">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="input-icon-wrap" style={{ flex: 1 }}>
                    <Lock size={16} className="input-icon" />
                    <input
                      required
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                  <button type="button" className="pw-toggle-btn" onClick={() => setShowConfirm(!showConfirm)} title="Toggle Confirm Password Visibility">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" className="btn-primary w-full auth-submit-btn" disabled={loading}>
                {loading ? <><Loader size={16} className="spin" /> Resetting…</> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
