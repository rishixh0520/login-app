import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api, API_BASE_URL } from '../api';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Briefcase, DollarSign, Calendar, Star } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import SkeletonLoader from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [rating, setRating] = useState(0);
  const [remark, setRemark] = useState('');
  const [savingPerf, setSavingPerf] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        setEmployee(res.data);
        setRating(res.data.performance_rating || 0);
        setRemark(res.data.performance_remark || '');
      } catch (error) {
        toast.error('Failed to load employee details');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <SkeletonLoader type="card" count={1} />
        <div style={{ marginTop: '2rem' }}>
          <SkeletonLoader type="text" count={5} />
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const initials = employee.employee_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/employees')} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Employee Profile</h1>
          <p>Detailed view of employee records</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('performance')} 
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'performance' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'performance' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Performance
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 2fr)', gap: '2rem' }}>
        <AnimatedCard delay={0.1}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
            <div className="avatar" style={{ width: '120px', height: '120px', fontSize: '2.5rem', marginBottom: '1rem' }}>
              {initials}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>{employee.employee_name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{employee.designation || 'No Designation'}</span>
              {employee.department_name && (
                <span className="status-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {employee.department_name}
                </span>
              )}
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: 0, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Contact Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><Mail size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email</strong>
                <span>{employee.employee_email}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><Phone size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone</strong>
                <span>{employee.phone || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', gridColumn: '1 / -1' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><MapPin size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Address</strong>
                <span>{employee.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <h3 style={{ margin: '1rem 0 0 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Employment Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><Building2 size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Department</strong>
                <span>{employee.department_name || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><Briefcase size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Designation</strong>
                <span>{employee.designation || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><DollarSign size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary</strong>
                <span>{employee.salary ? `₹${Number(employee.salary).toLocaleString('en-IN')}` : 'Not set'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--panel-bg)', padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><Calendar size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Joined Date</strong>
                <span>{new Date(employee.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {employee.skills?.length > 0 && (
            <>
              <h3 style={{ margin: '1rem 0 0 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {employee.skills.map(s => (
                  <span key={s.id} style={{ padding: '6px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500 }}>
                    {s.skill_name}
                  </span>
                ))}
              </div>
            </>
          )}

          {employee.images?.length > 0 && (
            <>
              <h3 style={{ margin: '1rem 0 0 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Documents / Photos</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {employee.images.map(img => (
                  <img key={img.id} src={`${API_BASE_URL}${img.image_url}`} alt="document" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                ))}
              </div>
            </>
          )}
        </AnimatedCard>
        </div>
      ) : (
        <AnimatedCard>
          <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px' }}>Performance Evaluation</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Performance Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={32} 
                  fill={star <= rating ? 'var(--warning)' : 'transparent'}
                  color={star <= rating ? 'var(--warning)' : 'var(--border-color)'}
                  style={{ cursor: isAdmin ? 'pointer' : 'default', transition: 'all 0.2s' }}
                  onClick={() => isAdmin && setRating(star)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Admin Remarks</label>
            {isAdmin ? (
              <textarea 
                rows={5}
                className="form-input"
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Enter performance feedback..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            ) : (
              <div style={{ padding: '16px', background: 'var(--panel-bg)', borderRadius: '8px', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                {remark || <span style={{ color: 'var(--text-muted)' }}>No remarks provided.</span>}
              </div>
            )}
          </div>

          {isAdmin && (
            <button 
              className="btn-primary" 
              onClick={async () => {
                setSavingPerf(true);
                try {
                  await api.put(`/employees/${id}/performance`, { performance_rating: rating, performance_remark: remark });
                  toast.success('Performance updated successfully');
                  setEmployee(prev => ({ ...prev, performance_rating: rating, performance_remark: remark }));
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Failed to save performance');
                } finally {
                  setSavingPerf(false);
                }
              }} 
              disabled={savingPerf}
            >
              {savingPerf ? 'Saving...' : 'Save Performance Data'}
            </button>
          )}
        </AnimatedCard>
      )}
    </div>
  );
}
