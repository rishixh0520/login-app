import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import {
  ShieldCheck, Sparkles, Users, Layers,
  Eye, EyeOff, Mail, Lock, User, ArrowRight,
  CheckCircle, X, Loader, Zap
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSent, setFpSent] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
        localStorage.setItem('refreshToken', res.data.refreshToken);
        navigate('/dashboard');
        toast.success('Successfully logged in');
      } else {
        if (form.password !== form.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/signup', {
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: 'employee'
        });
        toast.success(res.data.message || 'Account created! You can now log in.');
        setIsLogin(true);
        setForm({ name: '', email: form.email, password: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!fpEmail) return toast.error('Please enter your email address.');
    setFpLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: fpEmail });
      toast.success(res.data.message);
      setFpSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setFpLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setFpEmail('');
    setFpSent(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-color)' }}>
      {/* Theme Toggle Top Right */}
      <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Left Branding Side (Hidden on Mobile) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ 
          flex: 1.2, 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', 
          color: 'white', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          padding: '4rem',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="auth-hero-panel"
      >
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(0,0,0,0.1)', borderRadius: '50%', filter: 'blur(50px)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Zap size={24} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '1px' }}>i-SOFTZONE</span>
        </div>

        <div style={{ zIndex: 10 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}>
            {isLogin ? 'Welcome back to your workspace.' : 'Join the next-gen HR platform.'}
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '80%', lineHeight: 1.6, marginBottom: '3rem' }}>
            Streamline your workflow with powerful tools for employee management, attendance tracking, and intuitive payroll.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '12px', backdropFilter: 'blur(10px)', width: 'fit-content' }}>
              <ShieldCheck size={20} /> <span style={{ fontWeight: 500 }}>Enterprise-grade security</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '12px', backdropFilter: 'blur(10px)', width: 'fit-content' }}>
              <Users size={20} /> <span style={{ fontWeight: 500 }}>Seamless team collaboration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '12px', backdropFilter: 'blur(10px)', width: 'fit-content' }}>
              <Layers size={20} /> <span style={{ fontWeight: 500 }}>Automated HR workflows</span>
            </div>
          </div>
        </div>

        <div style={{ zIndex: 10, fontSize: '0.9rem', opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} i-SOFTZONE Inc. All rights reserved.
        </div>
      </motion.div>

      {/* Right Form Side */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%', maxWidth: '440px' }}
        >
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </span>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{isLogin ? 'Log in to your account' : 'Create an account'}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{isLogin ? 'Enter your credentials to access the dashboard.' : 'Fill in the details below to get started.'}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-soft)' }} />
                  <input required placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ paddingLeft: '48px' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-soft)' }} />
                <input required type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: '48px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                {isLogin && (
                  <button type="button" onClick={() => setShowForgotModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-soft)' }} />
                <input required type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ paddingLeft: '48px', paddingRight: '48px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-soft)' }} />
                  <input required type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} style={{ paddingLeft: '48px', paddingRight: '48px' }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' }}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
              {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> {isLogin ? 'Signing in...' : 'Creating account...'}</> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={switchMode} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.target === e.currentTarget && closeForgotModal()}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card"
            style={{ width: '100%', maxWidth: '440px', padding: '2rem', position: 'relative' }}
          >
            <button onClick={closeForgotModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--border-light)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}><X size={16} /></button>
            
            {fpSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Check your email</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We've sent a password reset link to <strong>{fpEmail}</strong>.</p>
                <button className="btn-primary" style={{ width: '100%' }} onClick={closeForgotModal}>Back to login</button>
              </div>
            ) : (
              <div>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Mail size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Forgot password?</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No worries, we'll send you reset instructions.</p>
                
                <form onSubmit={handleForgotSubmit}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                    <input required type="email" placeholder="Enter your email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={fpLoading}>
                    {fpLoading ? 'Sending...' : 'Reset Password'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
