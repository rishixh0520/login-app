import React, { useEffect, useState } from 'react';
import { api } from '../api';

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

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Leaves</h1>
        <p>Apply for leave and review leave requests</p>
      </header>

      {message && <div className="alert">{message}</div>}

      <div className="card">
        <h3>Apply Leave</h3>
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
        <h3>My Leave Requests</h3>
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
            {myLeaves.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.leave_name}</td>
                <td>{leave.from_date}</td>
                <td>{leave.to_date}</td>
                <td>{leave.total_days}</td>
                <td>{leave.status}</td>
                <td>{leave.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {['admin', 'manager', 'hr'].includes(role) && (
        <div className="card">
          <h3>All Leave Requests</h3>
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
              </tr>
            </thead>
            <tbody>
              {allLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee_name}</td>
                  <td>{leave.leave_name}</td>
                  <td>{leave.from_date}</td>
                  <td>{leave.to_date}</td>
                  <td>{leave.total_days}</td>
                  <td>{leave.status}</td>
                  <td>{leave.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}