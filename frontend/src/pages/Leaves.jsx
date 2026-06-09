import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CalendarDays, ClipboardList, Users } from 'lucide-react';

const initialForm = {
  leave_type_id: '',
  from_date: '',
  to_date: '',
  reason: '',
};

export default function Leaves() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState(localStorage.getItem('role') || 'employee');

  const loadData = async () => {
    try {
      // Load the employee-facing data first; reviewer data is optional by role.
      const [typesRes, mineRes] = await Promise.all([
        api.get('/leaves/types'),
        api.get('/leaves/mine'),
      ]);
      setLeaveTypes(typesRes.data);
      setMyLeaves(mineRes.data);

      if (['admin', 'manager', 'hr'].includes(role)) {
        const allRes = await api.get('/leaves/all');
        setAllLeaves(allRes.data);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load leave data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      // Submit the leave request, then refresh both tables so the new record is visible immediately.
      await api.post('/leaves/apply', form);
      setMessage('Leave application submitted');
      setForm(initialForm);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit leave application');
    }
  };

  const handleReview = async (id, action) => {
    try {
      await api.post(`/leaves/${id}/review`, { action, remarks: `Reviewed by ${role}` });
      setMessage(`Leave application ${action}`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to review leave application');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header dashboard-header">
        <div>
          <span className="eyebrow">Approval workflow</span>
          <h1>Leaves</h1>
          <p>Apply for leave and review leave requests</p>
        </div>
        <div className="header-chip">
          <ClipboardList size={16} />
          Workflow ready
        </div>
      </header>

      <div className="hero-band hero-band-soft">
        <div className="hero-mini-cards">
          <div className="mini-card"><CalendarDays size={16} /><span>Request leave without the back-and-forth</span></div>
          <div className="mini-card"><Users size={16} /><span>Manager and HR review it in order</span></div>
        </div>
        <p>Submit a request, then check how it moves through the queue without having to guess what happened.</p>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="card">
        <div className="section-title-row">
          <h3>Apply Leave</h3>
          <span className="section-caption">Dates are counted inclusively</span>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Leave Type</label>
            <select value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.leave_name}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>From Date</label>
            <input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
          </div>
          <div className="input-group">
            <label>To Date</label>
            <input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
          </div>
          <div className="input-group full">
            <label>Reason</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Submit Leave</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="section-title-row">
          <h3>My Leave Requests</h3>
          <span className="section-caption">Employee view</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {myLeaves.length ? myLeaves.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.leave_name}</td>
                <td>{leave.from_date}</td>
                <td>{leave.to_date}</td>
                <td>{leave.total_days}</td>
                <td><span className={`status-badge ${leave.status}`}>{leave.status.replace(/_/g, ' ')}</span></td>
                <td>{leave.reason}</td>
              </tr>
            )) : (
              <tr><td className="table-empty" colSpan="6">No leave requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {['admin', 'manager', 'hr'].includes(role) && (
        <div className="card">
          <div className="section-title-row">
            <h3>All Leave Requests</h3>
            <span className="section-caption">Reviewer view</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allLeaves.length ? allLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee_name}</td>
                  <td>{leave.leave_name}</td>
                  <td>{leave.from_date}</td>
                  <td>{leave.to_date}</td>
                  <td>{leave.total_days}</td>
                  <td><span className={`status-badge ${leave.status}`}>{leave.status.replace(/_/g, ' ')}</span></td>
                  <td>{leave.reason}</td>
                  <td>
                    {leave.status === 'pending_manager' || leave.status.startsWith('pending') ? (
                      <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleReview(leave.id, 'approved')}>Approve</button>
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleReview(leave.id, 'rejected')}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td className="table-empty" colSpan="8">No reviewer records available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}