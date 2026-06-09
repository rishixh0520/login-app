import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './redux/authSlice';
import { api } from './api';
import { LayoutDashboard, Users, Database, Layers, LogOut, Sparkles, Package, FileText, Bell, Clock } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Master from './pages/Master';
import Joins from './pages/Joins';
import Leaves from './pages/Leaves';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Attendance from './pages/Attendance';
import GlobalSearch from './components/GlobalSearch';
import './styles.css';

function Layout({ children }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const role = user?.role || 'employee';

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/auth/logout', { token: refreshToken });
    } catch(e) {}
    dispatch(logout());
    window.location.href = "/";
  };
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/attendance', label: 'Attendance', icon: Clock },
    { path: '/master', label: 'Master Data', icon: Layers },
    { path: '/leaves', label: 'Leaves', icon: Users },
    { path: '/assets', label: 'Assets', icon: Package },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/joins', label: 'SQL Joins', icon: Database },
  ];
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <h2>Login App</h2>
          </div>
        </div>
        <div className="sidebar-user">
          <span className="sidebar-user-label">Signed in as</span>
          <strong>{user?.name || 'Team member'}</strong>
          <span className="sidebar-user-role">{role}</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} /><span>{item.label}</span>
              </Link>
            );
          })}
          <button className="nav-item logout-btn" onClick={handleLogout}><LogOut size={18} /><span>Logout</span></button>
        </nav>
      </aside>
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <GlobalSearch />
          <Link to="/notifications" style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} />
            <span>Notifications</span>
          </Link>
        </div>
        {children}
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
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/employees" element={<Protected><Employees /></Protected>} />
        <Route path="/master" element={<Protected><Master /></Protected>} />
        <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
        <Route path="/leaves" element={<Protected><Leaves /></Protected>} />
        <Route path="/assets" element={<Protected><Assets /></Protected>} />
        <Route path="/reports" element={<Protected><Reports /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/joins" element={<Protected><Joins /></Protected>} />
      </Routes>
    </Router>
  );
}
