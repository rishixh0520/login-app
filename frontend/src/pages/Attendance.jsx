import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Clock, CheckCircle, Play, Square, AlertCircle, Calendar, Search, Filter, Edit3, X, Save } from 'lucide-react';

export default function Attendance() {
  const [history, setHistory] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [allHistory, setAllHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [todayRecord, setTodayRecord] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('');
  
  // Filters
  const [empStartDate, setEmpStartDate] = useState('');
  const [empEndDate, setEmpEndDate] = useState('');
  
  const [adminSearch, setAdminSearch] = useState('');
  const [adminDept, setAdminDept] = useState('');
  const [adminStartDate, setAdminStartDate] = useState('');
  const [adminEndDate, setAdminEndDate] = useState('');
  
  // Admin Edit Modal
  const [editRecord, setEditRecord] = useState(null);
  const [editData, setEditData] = useState({ clock_in: '', clock_out: '', status: '', remarks: '' });
  
  const role = localStorage.getItem('role') || 'employee';

  const loadEmployeeData = async () => {
    try {
      const params = new URLSearchParams();
      if (empStartDate) params.append('startDate', empStartDate);
      if (empEndDate) params.append('endDate', empEndDate);
      
      const mineRes = await api.get(`/attendance/mine?${params.toString()}`);
      setHistory(mineRes.data.records);
      setPercentage(mineRes.data.percentage);
      
      // Update today's record independently of filters (we always want to know if they're clocked in today)
      const todayDate = new Date().toISOString().split('T')[0];
      const today = mineRes.data.records.find(r => r.date.startsWith(todayDate));
      setTodayRecord(today || null);
    } catch (error) {
      console.error(error);
    }
  };

  const loadAdminData = async () => {
    if (!['admin', 'hr', 'manager'].includes(role)) return;
    try {
      const params = new URLSearchParams();
      if (adminSearch) params.append('search', adminSearch);
      if (adminDept) params.append('department', adminDept);
      if (adminStartDate) params.append('startDate', adminStartDate);
      if (adminEndDate) params.append('endDate', adminEndDate);

      const allRes = await api.get(`/attendance/all?${params.toString()}`);
      setAllHistory(allRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadEmployeeData();
    loadAdminData();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [empStartDate, empEndDate, adminSearch, adminDept, adminStartDate, adminEndDate]);

  // Elapsed time calculator
  useEffect(() => {
    if (todayRecord && todayRecord.clock_in && !todayRecord.clock_out) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(todayRecord.clock_in);
        const diff = Math.floor((now - start) / 1000);
        
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${h}h ${m}m ${s}s`);
      }, 1000);
      return () => clearInterval(interval);
    } else if (todayRecord && todayRecord.clock_out) {
      const start = new Date(todayRecord.clock_in);
      const end = new Date(todayRecord.clock_out);
      const diff = Math.floor((end - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      setElapsedTime(`${h}h ${m}m`);
    } else {
      setElapsedTime('00h 00m 00s');
    }
  }, [todayRecord]);

  const handleClockIn = async () => {
    try {
      await api.post('/attendance/clock-in');
      setMessage('Clocked in successfully! Have a great day.');
      loadEmployeeData();
      loadAdminData();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.put('/attendance/clock-out');
      setMessage('Clocked out successfully! Great work today.');
      loadEmployeeData();
      loadAdminData();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to clock out');
    }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/attendance/${editRecord.id}`, editData);
      setMessage('Attendance record updated successfully.');
      setEditRecord(null);
      loadAdminData();
      loadEmployeeData();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update record');
    }
  };

  const formatTimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    // adjust for local timezone to populate datetime-local input correctly
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16); 
  };

  const isWorking = todayRecord && todayRecord.clock_in && !todayRecord.clock_out;
  const isDone = todayRecord && todayRecord.clock_out;

  const calculateTotalHours = (inTime, outTime) => {
    if (!inTime || !outTime) return '-';
    const diff = (new Date(outTime) - new Date(inTime)) / 1000 / 3600;
    return diff.toFixed(2) + ' hrs';
  };

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <header className="page-header">
        <h1>Attendance Interface</h1>
        <p>Real-time presence tracking and shift management</p>
      </header>

      {message && (
        <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} /> {message}
        </div>
      )}

      <div className="two-col">
        {/* Left Column: Clock In/Out Terminal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '350px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span className="eyebrow">Current System Time</span>
            <div style={{ fontSize: '3.5rem', fontWeight: '800', fontFamily: 'Outfit', background: 'linear-gradient(90deg, #00f0ff, #b026ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '5px' }}>
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-light)', width: '100%', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className={`status-badge ${isWorking ? 'approved' : (isDone ? 'available' : 'rejected')}`} style={{ fontSize: '1rem' }}>
                {isDone ? `Completed: ${todayRecord.status}` : (isWorking ? 'Active Shift' : 'Offline')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Session Time:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isWorking ? 'var(--primary)' : 'var(--text-main)' }}>{elapsedTime}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
            {!isWorking && !isDone && (
              <button className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.2rem', padding: '15px' }} onClick={handleClockIn}>
                <Play size={24} /> INITIALIZE SHIFT
              </button>
            )}
            
            {isWorking && (
              <button className="btn-danger" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.2rem', padding: '15px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }} onClick={handleClockOut}>
                <Square size={24} /> TERMINATE SHIFT
              </button>
            )}

            {isDone && (
              <button className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.2rem', padding: '15px', opacity: 0.5 }} disabled>
                <CheckCircle size={24} /> SHIFT COMPLETE
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Personal History */}
        <div className="card">
          <div className="section-title-row" style={{ marginBottom: '10px' }}>
            <h3><Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> My Recent Logs</h3>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: percentage >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              {percentage}% MTD
            </span>
          </div>
          
          <div className="inline-form" style={{ marginBottom: '15px' }}>
            <input type="date" value={empStartDate} onChange={e => setEmpStartDate(e.target.value)} title="Start Date" />
            <input type="date" value={empEndDate} onChange={e => setEmpEndDate(e.target.value)} title="End Date" />
          </div>

          <div className="table-responsive" style={{ maxHeight: '230px', overflowY: 'auto' }}>
            <table>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--panel-bg)', backdropFilter: 'blur(10px)' }}>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map(row => (
                  <tr key={row.id}>
                    <td>{new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    <td style={{ color: 'var(--primary)' }}>{row.clock_in ? new Date(row.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ color: 'var(--warning)' }}>{row.clock_out ? new Date(row.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{calculateTotalHours(row.clock_in, row.clock_out)}</td>
                    <td>
                      <span className={`status-badge ${row.status === 'Present' ? 'approved' : row.status === 'Half-Day' ? 'pending_hr' : 'rejected'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="table-empty">No records found for selected dates.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin/Manager Global View */}
      {['admin', 'hr', 'manager'].includes(role) && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="section-title-row">
            <h3>Enterprise Attendance Ledger</h3>
            <span className="section-caption">Real-time tracking and editing</span>
          </div>
          
          <div className="inline-form" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '15px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search employee..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} style={{ paddingLeft: '35px' }} />
            </div>
            <select style={{ flex: 1, minWidth: '150px' }} value={adminDept} onChange={e => setAdminDept(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Software Development">Software Development</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Sales">Sales</option>
              <option value="Quality Assurance">Quality Assurance</option>
            </select>
            <input type="date" style={{ flex: 1, minWidth: '130px' }} value={adminStartDate} onChange={e => setAdminStartDate(e.target.value)} />
            <input type="date" style={{ flex: 1, minWidth: '130px' }} value={adminEndDate} onChange={e => setAdminEndDate(e.target.value)} />
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allHistory.length > 0 ? allHistory.map(row => (
                  <tr key={row.id}>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 'bold' }}>{row.name}</td>
                    <td><span className="pill">{row.department_name}</span></td>
                    <td style={{ color: 'var(--primary)' }}>{row.clock_in ? new Date(row.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                    <td style={{ color: 'var(--warning)' }}>{row.clock_out ? new Date(row.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                    <td>{calculateTotalHours(row.clock_in, row.clock_out)}</td>
                    <td>
                      <span className={`status-badge ${row.status === 'Present' ? 'approved' : row.status === 'Half-Day' ? 'pending_hr' : 'rejected'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.85rem' }} onClick={() => {
                        setEditRecord(row);
                        setEditData({
                          clock_in: formatTimeLocal(row.clock_in),
                          clock_out: formatTimeLocal(row.clock_out),
                          status: row.status,
                          remarks: row.remarks || ''
                        });
                      }}>
                        <Edit3 size={16} /> Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="table-empty">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {editRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}>
            <button onClick={() => setEditRecord(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ margin: '0 0 20px', fontSize: '1.5rem' }}>Edit Record: {editRecord.name}</h2>
            <p style={{ color: 'var(--primary)', marginBottom: '20px' }}>Date: {new Date(editRecord.date).toLocaleDateString()}</p>
            
            <div className="input-group">
              <label>Status</label>
              <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                <option value="Present">Present</option>
                <option value="Half-Day">Half-Day</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Clock In (Override)</label>
              <input type="datetime-local" value={editData.clock_in} onChange={e => setEditData({...editData, clock_in: e.target.value})} disabled={['Absent', 'On Leave'].includes(editData.status)} />
            </div>
            
            <div className="input-group">
              <label>Clock Out (Override)</label>
              <input type="datetime-local" value={editData.clock_out} onChange={e => setEditData({...editData, clock_out: e.target.value})} disabled={['Absent', 'On Leave'].includes(editData.status)} />
            </div>
            
            <div className="input-group">
              <label>Remarks / Reason</label>
              <textarea value={editData.remarks} onChange={e => setEditData({...editData, remarks: e.target.value})} placeholder="Reason for edit..." rows={3}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditRecord(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} onClick={handleEditSave}>
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
