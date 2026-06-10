import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle, AlertCircle, Calendar, Search, Edit3, X, Save, TimerReset, LogIn, LogOut, Activity, UserCheck } from 'lucide-react';

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      
      const todayDate = getLocalDateKey();
      let today = mineRes.data.records.find(r => r.date.startsWith(todayDate));
      if ((empStartDate || empEndDate) && !today) {
        const todayRes = await api.get(`/attendance/mine?startDate=${todayDate}&endDate=${todayDate}`);
        today = todayRes.data.records.find(r => r.date.startsWith(todayDate));
      }
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
      <header className="page-header dashboard-header">
        <div>
          <span className="eyebrow">Attendance</span>
          <h1>Workday Clock</h1>
          <p>Clock in when the shift starts, clock out when the workday is complete.</p>
        </div>
        <div className={`attendance-live-chip ${isWorking ? 'is-live' : ''}`}>
          <Activity size={16} />
          {isWorking ? 'Live shift running' : isDone ? 'Shift completed' : 'Ready to start'}
        </div>
      </header>

      {message && (
        <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} /> {message}
        </div>
      )}

      <div className="attendance-grid">
        <section className="attendance-clock-card">
          <div className="attendance-time-block">
            <span className="eyebrow">Current time</span>
            <div className="attendance-time">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="attendance-date">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="attendance-status-panel">
            <div>
              <span>Today status</span>
              <strong>{isDone ? todayRecord.status : isWorking ? 'Active shift' : 'Not clocked in'}</strong>
            </div>
            <span className={`status-badge ${isWorking ? 'approved' : (isDone ? 'available' : 'rejected')}`}>
              {isWorking ? 'Clocked in' : isDone ? 'Clocked out' : 'Offline'}
            </span>
          </div>

          <div className="attendance-session">
            <TimerReset size={20} />
            <div>
              <span>{isDone ? 'Total time' : 'Session time'}</span>
              <strong>{elapsedTime}</strong>
            </div>
          </div>

          <div className="attendance-actions">
            {!isWorking && !isDone && (
              <button className="btn-primary attendance-action-btn" onClick={handleClockIn}>
                <LogIn size={22} /> Clock In
              </button>
            )}
            
            {isWorking && (
              <button className="btn-danger attendance-action-btn attendance-clockout" onClick={handleClockOut}>
                <LogOut size={22} /> Clock Out
              </button>
            )}

            {isDone && (
              <button className="btn-secondary attendance-action-btn" disabled>
                <CheckCircle size={22} /> Shift Complete
              </button>
            )}
          </div>
        </section>

        <section className="card attendance-history-card">
          <div className="section-title-row" style={{ marginBottom: '10px' }}>
            <h3><Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> My Attendance</h3>
            <span className={`attendance-percent ${percentage >= 80 ? 'good' : 'needs-attention'}`}>{percentage}% MTD</span>
          </div>

          <div className="attendance-mini-stats">
            <div>
              <LogIn size={16} />
              <span>Clock in</span>
              <strong>{todayRecord?.clock_in ? new Date(todayRecord.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
            </div>
            <div>
              <LogOut size={16} />
              <span>Clock out</span>
              <strong>{todayRecord?.clock_out ? new Date(todayRecord.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
            </div>
            <div>
              <UserCheck size={16} />
              <span>Records</span>
              <strong>{history.length}</strong>
            </div>
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
        </section>
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
