import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Users, Wallet, Clock3, Percent, ChevronLeft } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import SkeletonLoader from '../components/SkeletonLoader';

export default function DepartmentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ kpis: {}, charts: {} });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch departments to map ID to Name
    api.get('/departments').then(res => setDepartments(res.data)).catch(console.error);
    
    setLoading(true);
    api.get(`/analytics/department/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load department analytics", err);
        setLoading(false);
      });
  }, [id]);

  const { kpis, charts } = data;
  const deptName = departments.find(d => d.id.toString() === id)?.department_name || `Department ${id}`;

  const cards = [
    { label: 'Total Employees', value: kpis.totalEmployees || 0, icon: Users, color: 'blue' },
    { label: 'Department Payroll', value: kpis.departmentPayroll || 0, prefix: '₹', icon: Wallet, color: 'purple' },
    { label: 'Average Salary', value: kpis.averageSalary || 0, prefix: '₹', icon: Wallet, color: 'green' },
    { label: 'Open Leave Requests', value: kpis.openLeaveRequests || 0, icon: Clock3, color: 'orange' },
    { label: 'Attendance Rate', value: kpis.attendanceRate || 0, suffix: '%', icon: Percent, color: 'indigo' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e', '#6366f1'];
  const textColor = { fill: 'var(--text-muted)', fontSize: 12 };
  const gridColor = 'var(--border-light)';

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '8px' }}><ChevronLeft size={20} /></button>
        <div>
          <h1>{deptName} Dashboard</h1>
          <p>Localized KPIs and Analytics</p>
        </div>
      </header>

      <div className="stats-grid">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: '16px' }}>
              <SkeletonLoader type="circle" count={1} />
              <div style={{ flex: 1 }}><SkeletonLoader type="text" count={2} /></div>
            </div>
          ))
        ) : (
          cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <AnimatedCard key={c.label} delay={i * 0.05} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <Icon size={24} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1.6rem', margin: 0 }}>
                    <AnimatedCounter value={c.value} prefix={c.prefix} suffix={c.suffix} />
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.label}</p>
                </div>
              </AnimatedCard>
            );
          })
        )}
      </div>

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginTop: '32px' }}>

          {/* Performance Distribution */}
          <AnimatedCard delay={0.2}>
            <h3 style={{ marginBottom: '20px' }}>Performance Spread</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.performanceDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={textColor} axisLine={false} tickLine={false} />
                  <YAxis tick={textColor} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Gender Diversity */}
          <AnimatedCard delay={0.3}>
            <h3 style={{ marginBottom: '20px' }}>Gender Diversity</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.genderDiversity} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={5}>
                    {charts.genderDiversity?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#3b82f6' : entry.name === 'Female' ? '#ec4899' : '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

        </div>
      )}
    </div>
  );
}
