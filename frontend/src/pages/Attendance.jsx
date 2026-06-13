import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';
import {
  CheckCircle, Calendar, Search, Edit3, X, Save,
  Timer, LogIn, LogOut, Activity, UserCheck, TrendingUp,
  Sun, Moon, Sunset, Coffee
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import ModernTable from '../components/ModernTable';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const getLocalDateKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const calcHours = (inT, outT) => {
  if (!inT || !outT) return null;
  const diff = (new Date(outT) - new Date(inT)) / 3600000;
  return diff.toFixed(2);
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: Sun };
  if (h < 17) return { text: 'Good Afternoon', icon: Coffee };
  if (h < 20) return { text: 'Good Evening', icon: Sunset };
  return { text: 'Good Night', icon: Moon };
};

export default function Attendance() {
  const [history, setHistory]           = useState([]);
  const [percentage, setPercentage]     = useState(0);
  const [allHistory, setAllHistory]     = useState([]);
  const [todayRecord, setTodayRecord]   = useState(null);
  const [currentTime, setCurrentTime]   = useState(new Date());
  const [elapsed, setElapsed]           = useState('00:00:00');
  const [checkingIn, setCheckingIn]     = useState(false);
  const [checkingOut, setCheckingOut]   = useState(false);

  // Filters – employee
  const [empStartDate, setEmpStartDate] = useState('');
  const [empEndDate,   setEmpEndDate]   = useState('');

  // Filters – admin
  const [adminDept,      setAdminDept]      = useState('');
  const [adminStartDate, setAdminStartDate] = useState('');
  const [adminEndDate,   setAdminEndDate]   = useState('');

  // Edit modal
  const [editRecord, setEditRecord] = useState(null);
  const [editData,   setEditData]   = useState({ clock_in: '', clock_out: '', status: '', remarks: '' });

  const role = localStorage.getItem('role') || 'employee';

  const loadEmployeeData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (empStartDate) params.append('startDate', empStartDate);
      if (empEndDate)   params.append('endDate',   empEndDate);
      const res = await api.get(`/attendance/mine?${params}`);
      setHistory(res.data.records);
      setPercentage(res.data.percentage);

      const nowLocal = new Date();
      const todayY   = nowLocal.getFullYear();
      const todayM   = nowLocal.getMonth();
      const todayD   = nowLocal.getDate();

      const isToday = (r) => {
        if (r.clock_in) {
          const d = new Date(r.clock_in);
          return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;
        }
        const dateStr = r.date?.slice(0, 10);
        const localKey = `${todayY}-${String(todayM+1).padStart(2,'0')}-${String(todayD).padStart(2,'0')}`;
        return dateStr === localKey;
      };

      let rec = res.data.records.find(isToday);

      if ((empStartDate || empEndDate) && !rec) {
        const localKey = `${todayY}-${String(todayM+1).padStart(2,'0')}-${String(todayD).padStart(2,'0')}`;
        const r2 = await api.get(`/attendance/mine?startDate=${localKey}&endDate=${localKey}`);
        rec = r2.data.records.find(isToday);
      }

      setTodayRecord(rec || null);
    } catch (e) { console.error(e); }
  }, [empStartDate, empEndDate]);

  const loadAdminData = useCallback(async () => {
    if (!['admin', 'hr', 'manager'].includes(role)) return;
    try {
      const params = new URLSearchParams();
      if (adminDept)      params.append('department', adminDept);
      if (adminStartDate) params.append('startDate',  adminStartDate);
      if (adminEndDate)   params.append('endDate',    adminEndDate);
      const res = await api.get(`/attendance/all?${params}`);
      setAllHistory(res.data);
    } catch (e) { console.error(e); }
  }, [role, adminDept, adminStartDate, adminEndDate]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (todayRecord?.clock_in && !todayRecord?.clock_out) {
      const tick = () => {
        const diff = Math.floor((Date.now() - new Date(todayRecord.clock_in)) / 1000);
        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        setElapsed(`${h}:${m}:${s}`);
      };
      tick();
      const t = setInterval(tick, 1000);
      return () => clearInterval(t);
    }
    if (todayRecord?.clock_out) {
      const diff = Math.floor((new Date(todayRecord.clock_out) - new Date(todayRecord.clock_in)) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      setElapsed(`${h}:${m}:00`);
    } else {
      setElapsed('00:00:00');
    }
  }, [todayRecord]);

  useEffect(() => {
    loadEmployeeData();
    loadAdminData();
  }, [loadEmployeeData, loadAdminData]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/clock-in');
      toast.success('Checked in successfully! Have a productive day.');
      loadEmployeeData(); loadAdminData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to check in');
    } finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await api.put('/attendance/clock-out');
      toast.success('Checked out successfully! Great work today.');
      loadEmployeeData(); loadAdminData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to check out');
    } finally { setCheckingOut(false); }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/attendance/${editRecord.id}`, editData);
      toast.success('Record updated successfully.');
      setEditRecord(null);
      loadAdminData(); loadEmployeeData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    }
  };

  const formatTimeLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const isCheckedIn  = todayRecord?.clock_in && !todayRecord?.clock_out;
  const isCheckedOut = !!todayRecord?.clock_out;

  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  const myColumns = useMemo(() => [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) },
    { header: 'Check In', render: (row) => <strong style={{ color: 'var(--success)' }}>{formatTime(row.clock_in)}</strong> },
    { header: 'Check Out', render: (row) => <strong style={{ color: 'var(--warning)' }}>{formatTime(row.clock_out)}</strong> },
    { header: 'Hours', render: (row) => { const hrs = calcHours(row.clock_in, row.clock_out); return hrs ? `${hrs}h` : '—'; } },
    { header: 'Status', render: (row) => <span className={`status-badge ${row.status === 'Present' ? 'approved' : row.status === 'Half-Day' ? 'pending' : 'rejected'}`}>{row.status}</span> }
  ], []);

  const adminColumns = useMemo(() => [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString([], { day: '2-digit', month: 'short' }) },
    { header: 'Employee', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Check In', render: (row) => <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatTime(row.clock_in)}</span> },
    { header: 'Check Out', render: (row) => <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{formatTime(row.clock_out)}</span> },
    { header: 'Hours', render: (row) => { const hrs = calcHours(row.clock_in, row.clock_out); return hrs ? `${hrs}h` : '—'; } },
    { header: 'Status', render: (row) => <span className={`status-badge ${row.status === 'Present' ? 'approved' : row.status === 'Half-Day' ? 'pending' : 'rejected'}`}>{row.status}</span> },
    { header: 'Edit', render: (row) => (
      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => {
        setEditRecord(row);
        setEditData({ clock_in: formatTimeLocal(row.clock_in), clock_out: formatTimeLocal(row.clock_out), status: row.status, remarks: row.remarks || '' });
      }}><Edit3 size={14} /></button>
    )}
  ], []);

  return (
    <div>
      <header className="page-header">
        <h1>Attendance Tracking</h1>
        <p>Clock in, track your hours, and view historical records.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.5fr)', gap: '2rem', marginBottom: '2rem' }}>
        <AnimatedCard delay={0.1} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <GreetIcon size={18} /> {greeting.text}
          </div>
          <div>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px', marginBottom: '8px' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div style={{ opacity: 0.8, fontSize: '0.95rem' }}>
              {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
            {!isCheckedIn && !isCheckedOut && (
              <button className="btn-primary" style={{ flex: 1, background: 'white', color: 'var(--primary)', padding: '16px', fontSize: '1.1rem' }} onClick={handleCheckIn} disabled={checkingIn}>
                <LogIn size={20} /> {checkingIn ? '...' : 'Check In'}
              </button>
            )}
            {isCheckedIn && (
              <button className="btn-primary" style={{ flex: 1, background: 'var(--warning)', color: 'white', padding: '16px', fontSize: '1.1rem' }} onClick={handleCheckOut} disabled={checkingOut}>
                <LogOut size={20} /> {checkingOut ? '...' : 'Check Out'}
              </button>
            )}
            {isCheckedOut && (
              <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '16px', fontSize: '1.1rem' }} disabled>
                <CheckCircle size={20} /> Shift Complete
              </button>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} /> Daily Overview</h3>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace' }}>{elapsed}</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <LogIn size={16} style={{ color: 'var(--success)' }} /> Time In
              </div>
              <strong style={{ fontSize: '1.4rem' }}>{formatTime(todayRecord?.clock_in)}</strong>
            </div>
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <LogOut size={16} style={{ color: 'var(--warning)' }} /> Time Out
              </div>
              <strong style={{ fontSize: '1.4rem' }}>{formatTime(todayRecord?.clock_out)}</strong>
            </div>
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Timer size={16} style={{ color: 'var(--primary)' }} /> Total Hours
              </div>
              <strong style={{ fontSize: '1.4rem' }}>{calcHours(todayRecord?.clock_in, todayRecord?.clock_out) ? `${calcHours(todayRecord?.clock_in, todayRecord?.clock_out)}h` : '--'}</strong>
            </div>
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Monthly %
              </div>
              <strong style={{ fontSize: '1.4rem', color: percentage >= 80 ? 'var(--success)' : 'var(--warning)' }}>{percentage}%</strong>
            </div>
          </div>
        </AnimatedCard>
      </div>

      <AnimatedCard delay={0.3} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} /> My Attendance History</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter:</span>
            <input type="date" value={empStartDate} onChange={e => setEmpStartDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            <input type="date" value={empEndDate} onChange={e => setEmpEndDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
          </div>
        </div>
        <ModernTable columns={myColumns} data={history} searchable={false} itemsPerPage={5} />
      </AnimatedCard>

      {['admin', 'hr', 'manager'].includes(role) && (
        <AnimatedCard delay={0.4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><UserCheck size={20} /> Enterprise Ledger</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select value={adminDept} onChange={e => setAdminDept(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                <option value="">All Departments</option>
                <option value="Software Development">Software Development</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Sales">Sales</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
              <input type="date" value={adminStartDate} onChange={e => setAdminStartDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }} />
              <input type="date" value={adminEndDate} onChange={e => setAdminEndDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }} />
            </div>
          </div>
          <ModernTable columns={adminColumns} data={allHistory} searchable={true} itemsPerPage={10} />
        </AnimatedCard>
      )}

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {editRecord && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.target === e.currentTarget && setEditRecord(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}
            >
              <button style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setEditRecord(null)}>
                <X size={20} />
              </button>
              <h3 style={{ marginBottom: '8px' }}>Edit Attendance</h3>
              <p style={{ color: 'var(--primary)', marginBottom: '24px', fontWeight: 500 }}>{editRecord.name} · {new Date(editRecord.date).toLocaleDateString()}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Status</label>
                  <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                    <option value="Present">Present</option>
                    <option value="Half-Day">Half-Day</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Check In</label>
                    <input type="datetime-local" value={editData.clock_in} onChange={e => setEditData({ ...editData, clock_in: e.target.value })} disabled={['Absent','On Leave'].includes(editData.status)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Check Out</label>
                    <input type="datetime-local" value={editData.clock_out} onChange={e => setEditData({ ...editData, clock_out: e.target.value })} disabled={['Absent','On Leave'].includes(editData.status)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Remarks</label>
                  <textarea rows={3} value={editData.remarks} onChange={e => setEditData({ ...editData, remarks: e.target.value })} placeholder="Reason for change..." />
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={handleEditSave}>
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
