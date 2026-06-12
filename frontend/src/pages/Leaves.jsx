import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CalendarDays, ClipboardList, Users, Plus, CheckCircle, XCircle } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import ModernTable from '../components/ModernTable';
import toast from 'react-hot-toast';

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
  const [role, setRole] = useState(localStorage.getItem('role') || 'employee');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
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
      toast.error(error.response?.data?.message || 'Failed to load leave data');
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leaves/apply', form);
      toast.success('Leave application submitted successfully');
      setForm(initialForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, action) => {
    try {
      await api.post(`/leaves/${id}/review`, { action, remarks: `Reviewed by ${role}` });
      toast.success(`Leave application ${action}`);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review leave application');
    }
  };

  const myLeavesColumns = [
    { header: 'Leave Type', accessor: 'leave_name' },
    { header: 'Duration', render: (row) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 500 }}>{row.from_date} to {row.to_date}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.total_days} day(s)</span>
      </div>
    )},
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', render: (row) => (
      <span className={`status-badge ${row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending'}`}>
        {row.status.replace(/_/g, ' ')}
      </span>
    )}
  ];

  const allLeavesColumns = [
    { header: 'Employee', accessor: 'employee_name', render: (row) => <strong style={{ color: 'var(--text-main)' }}>{row.employee_name}</strong> },
    { header: 'Leave Type', accessor: 'leave_name' },
    { header: 'Duration', render: (row) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 500 }}>{row.from_date} to {row.to_date}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.total_days} day(s)</span>
      </div>
    )},
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', render: (row) => (
      <span className={`status-badge ${row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending'}`}>
        {row.status.replace(/_/g, ' ')}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      row.status === 'pending_manager' || row.status.startsWith('pending') ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ padding: '6px 12px', color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleReview(row.id, 'approved')} title="Approve">
            <CheckCircle size={16} />
          </button>
          <button className="btn-secondary" style={{ padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleReview(row.id, 'rejected')} title="Reject">
            <XCircle size={16} />
          </button>
        </div>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>Reviewed</span>
      )
    )}
  ];

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', fontWeight: 700 }}>Approval workflow</span>
          <h1>Leave Management</h1>
          <p>Apply for time off and review team requests</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
          <ClipboardList size={18} /> Workflow Ready
        </div>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <AnimatedCard delay={0.1} style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
              <Plus size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Apply Leave</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Dates are inclusive</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Leave Type</label>
              <select required value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.leave_name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>From Date</label>
                <input required type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>To Date</label>
                <input required type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Reason</label>
              <textarea required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly explain your reason for leave..." />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </AnimatedCard>

        <div style={{ flex: 2, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={20} /> My Leave History
            </h3>
            <ModernTable columns={myLeavesColumns} data={myLeaves} searchable={false} itemsPerPage={5} />
          </div>

          {['admin', 'manager', 'hr'].includes(role) && (
            <div>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Team Leave Requests
              </h3>
              <ModernTable columns={allLeavesColumns} data={allLeaves} searchable={true} itemsPerPage={5} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}