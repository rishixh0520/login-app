import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { ShieldCheck, Sparkles, Users, Layers } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
        localStorage.setItem('refreshToken', res.data.refreshToken); // Save refresh token
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/signup', form);
        setMessage(res.data.message || 'Registered successfully. Please check terminal to verify.');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Authentication failed');
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) return setMessage("Please enter your email first to reset password.");
    try {
      const res = await api.post('/auth/forgot-password', { email: form.email });
      setMessage(res.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-split">
        <section className="auth-hero">
          <div className="brand-mark brand-mark-large"><Sparkles size={18} /></div>
          <span className="eyebrow">i-SOFTZONE workforce suite</span>
          <h2>{isLogin ? 'Built for real teams, not demo clicks' : 'Set up the next workspace account'}</h2>
          <p>
            Keep employee records, leave approvals, and reporting in one place without making the screen feel heavy.
          </p>
          <div className="feature-list">
            <div><ShieldCheck size={16} />Simple sign in</div>
            <div><Users size={16} />Employee management</div>
            <div><Layers size={16} />Leave workflow</div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-badge">{isLogin ? 'Secure sign in' : 'New account'}</div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">{isLogin ? 'Login to your dashboard' : 'Register to manage employees'}</p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <label>Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="input-group">
              <label>Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            
            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontSize: '12px' }}>
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="btn-primary w-full">{isLogin ? 'Login' : 'Sign Up'}</button>
          </form>

          {message && <div className="alert">{message}</div>}

          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Sign up' : 'Login'}</button>
          </p>
        </section>
      </div>
    </div>
  );
}
