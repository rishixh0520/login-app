import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './redux/authSlice';
import { api } from './api';
import {
  LayoutDashboard, Users, Database, Layers, LogOut,
  Package, FileText, Bell, Clock, ChevronRight, Zap, CalendarCheck, Banknote, Menu, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Master from './pages/Master';
import Joins from './pages/Joins';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Attendance from './pages/Attendance';
import ResetPassword from './pages/ResetPassword';
import EmployeeProfile from './pages/EmployeeProfile';
import ManagerInsights from './pages/ManagerInsights';
import DepartmentDashboard from './pages/DepartmentDashboard';
import GlobalSearch from './components/GlobalSearch';
import ThemeToggle from './components/ThemeToggle';
import './styles.css';

const navItems = [
  { path: '/dashboard',   label: 'Executive Dashboard',   icon: LayoutDashboard, group: 'analytics' },
  { path: '/manager-insights', label: 'Manager Insights', icon: LayoutDashboard, group: 'analytics' },
  { path: '/employees',   label: 'Employees',   icon: Users,           group: 'main' },
  { path: '/attendance',  label: 'Attendance',  icon: Clock,           group: 'main' },
  { path: '/leaves',      label: 'Leaves',      icon: CalendarCheck,   group: 'main' },
  { path: '/payroll',     label: 'Payroll',     icon: Banknote,        group: 'main' },
  { path: '/assets',      label: 'Assets',      icon: Package,         group: 'manage' },
  { path: '/master',      label: 'Master Data', icon: Layers,          group: 'manage' },
  { path: '/reports',     label: 'Reports',     icon: FileText,        group: 'manage' },
  { path: '/joins',       label: 'SQL Joins',   icon: Database,        group: 'dev' },
];

function Layout({ children }) {
  const location = useLocation();
  const dispatch  = useDispatch();
  const { user }  = useSelector(state => state.auth);
  const role      = user?.role || 'employee';
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const [collapsed, setCollapsed] = useState(false);
  const [departments, setDepartments] = useState([]);

  React.useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem('refreshToken');
      if (rt) await api.post('/auth/logout', { token: rt });
    } catch (_) {}
    dispatch(logout());
    window.location.href = '/';
  };

  const groups = {
    analytics: { label: 'Analytics', items: navItems.filter(n => n.group === 'analytics') },
    main:   { label: 'Workspace',  items: navItems.filter(n => n.group === 'main') },
    departments: { label: 'Departments', items: departments.map(d => ({ path: `/department/${d.id}`, label: d.department_name, icon: Building2 })) },
    manage: { label: 'Management', items: navItems.filter(n => n.group === 'manage') },
    dev:    { label: 'Developer',  items: navItems.filter(n => n.group === 'dev') },
  };

  return (
    <div className="layout">
      <Toaster position="top-right" toastOptions={{ className: 'glass', style: { background: 'var(--panel-bg-solid)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } }} />
      <motion.aside 
        className="sidebar glass"
        initial={{ width: 260 }}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Brand */}
        <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'space-between', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-brand-icon"><Zap size={20} /></div>
            {!collapsed && <div className="sidebar-brand-name">i-SOFTZONE</div>}
          </div>
        </div>

        {/* User card */}
        {!collapsed && (
          <div style={{ padding: '0 1rem' }}>
            <div className="sidebar-user" style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="avatar">
                {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '0.9rem' }}>{user?.name || 'Team Member'}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>{role.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav className="sidebar-nav">
          {Object.entries(groups).map(([key, group]) => (
            group.items.length > 0 && (
              <div key={key} style={{ marginBottom: '1.5rem' }}>
                {!collapsed && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '1rem' }}>{group.label}</div>}
                {group.items.map(item => {
                  const Icon    = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '12px' : '10px 16px' }} title={collapsed ? item.label : ''}>
                      <Icon size={18} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{ borderTop: 'none', paddingBottom: '1.5rem' }}>
          {!collapsed && <div style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>{timeStr}</div>}
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title="Sign Out">
            <LogOut size={18} />{!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      <main className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <button onClick={() => setCollapsed(!collapsed)} className="btn-secondary" style={{ marginRight: 'auto', padding: '8px' }}>
            <Menu size={20} />
          </button>
          <GlobalSearch />
          <ThemeToggle />
          <Link to="/notifications" className="topbar-notif">
            <Bell size={18} />
            <span>Notifications</span>
          </Link>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const Protected = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"              element={<Auth />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
        <Route path="/employees"     element={<Protected><Employees /></Protected>} />
        <Route path="/employees/:id" element={<Protected><EmployeeProfile /></Protected>} />
        <Route path="/manager-insights" element={<Protected><ManagerInsights /></Protected>} />
        <Route path="/department/:id" element={<Protected><DepartmentDashboard /></Protected>} />
        <Route path="/master"        element={<Protected><Master /></Protected>} />
        <Route path="/attendance"    element={<Protected><Attendance /></Protected>} />
        <Route path="/leaves"        element={<Protected><Leaves /></Protected>} />
        <Route path="/payroll"       element={<Protected><Payroll /></Protected>} />
        <Route path="/assets"        element={<Protected><Assets /></Protected>} />
        <Route path="/reports"       element={<Protected><Reports /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/joins"         element={<Protected><Joins /></Protected>} />
      </Routes>
    </Router>
  );
}
