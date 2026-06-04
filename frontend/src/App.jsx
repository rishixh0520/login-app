import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Database, Layers, LogOut, Sparkles } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Master from './pages/Master';
import Joins from './pages/Joins';
import Leaves from './pages/Leaves';
import './styles.css';

function Layout({ children }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = localStorage.getItem('role') || 'employee';
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = "/";
  };
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/master', label: 'Master Data', icon: Layers },
    // Leave workflow is a first-class module in the enterprise menu.
    { path: '/leaves', label: 'Leaves', icon: Users },
    { path: '/joins', label: 'SQL Joins', icon: Database },
  ];
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-mark"><Sparkles size={16} /></div>
          <div>
            <h2>EmpSys</h2>
            <p>Workforce operations</p>
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
      <main className="main-content">{children}</main>
    </div>
  );
}

const Protected = ({ children }) => localStorage.getItem('token') ? <Layout>{children}</Layout> : <Navigate to="/" />;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/employees" element={<Protected><Employees /></Protected>} />
        <Route path="/master" element={<Protected><Master /></Protected>} />
        <Route path="/leaves" element={<Protected><Leaves /></Protected>} />
        <Route path="/joins" element={<Protected><Joins /></Protected>} />
      </Routes>
    </Router>
  );
}
