import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Users, Building2, UserPlus, Clock3, Sparkles, 
  Wallet, Shield, Activity, TrendingUp, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ kpis: {}, charts: {} });

  useEffect(() => {
    api.get('/analytics/executive')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics", err);
        setLoading(false);
      });
  }, []);

  const { kpis, charts } = data;

  const cards = [
    { label: 'Total Employees', value: kpis.totalEmployees || 0, icon: Users, color: 'blue' },
    { label: 'New Hires (Month)', value: kpis.newHiresThisMonth || 0, icon: UserPlus, color: 'green' },
    { label: 'Employees on Leave', value: kpis.employeesOnLeave || 0, icon: Clock3, color: 'orange' },
    { label: 'Total Payroll', value: kpis.totalMonthlyPayroll || 0, prefix: '₹', icon: Wallet, color: 'purple' },
    { label: 'Total TDS', value: kpis.totalTDS || 0, prefix: '₹', icon: Shield, color: 'red' },
    { label: 'Total PF', value: kpis.totalPF || 0, prefix: '₹', icon: Shield, color: 'indigo' },
    { label: 'Total ESI', value: kpis.totalESI || 0, prefix: '₹', icon: Shield, color: 'teal' },
    { label: 'Average Salary', value: kpis.averageSalary || 0, prefix: '₹', icon: Sparkles, color: 'pink' },
    { label: 'Attrition Rate', value: kpis.attritionRate || 0, suffix: '%', icon: TrendingUp, color: 'red' },
    { label: 'Retention Rate', value: kpis.retentionRate || 0, suffix: '%', icon: Activity, color: 'green' },
    { label: 'Attendance Rate', value: kpis.attendanceRate || 0, suffix: '%', icon: PieChartIcon, color: 'blue' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e', '#6366f1'];
  const textColor = { fill: 'var(--text-muted)', fontSize: 12 };
  const gridColor = 'var(--border-light)';

  return (
    <div>
      <header className="page-header">
        <h1>Executive Dashboard</h1>
        <p>Company-wide KPIs and Workforce Analytics</p>
      </header>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {loading ? (
          Array(11).fill(0).map((_, i) => (
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
          
          {/* Department Distribution (Donut) */}
          <AnimatedCard delay={0.1}>
            <h3 style={{ marginBottom: '20px' }}>Department Distribution</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={charts.departmentDistribution} 
                    cx="40%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="value" 
                    paddingAngle={2}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return percent > 0.05 ? (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12px" fontWeight="bold">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                  >
                    {charts.departmentDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Payroll Cost Trend (Area Chart) */}
          <AnimatedCard delay={0.2}>
            <h3 style={{ marginBottom: '20px' }}>Payroll Cost Trend</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.payrollCostTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={textColor} axisLine={false} tickLine={false} />
                  <YAxis tick={textColor} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <RechartsTooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPayroll)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Department Salary Comparison (Horizontal Bar Chart) */}
          <AnimatedCard delay={0.3}>
            <h3 style={{ marginBottom: '20px' }}>Average Salary by Department</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentSalaryComparison} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={textColor} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <YAxis dataKey="name" type="category" tick={textColor} axisLine={false} tickLine={false} width={100} />
                  <RechartsTooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Performance Distribution (Bar Chart) */}
          <AnimatedCard delay={0.4}>
            <h3 style={{ marginBottom: '20px' }}>Performance Distribution</h3>
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

          {/* Experience Distribution (Bar Chart) */}
          <AnimatedCard delay={0.5}>
            <h3 style={{ marginBottom: '20px' }}>Workforce Experience</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.experienceDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={textColor} axisLine={false} tickLine={false} />
                  <YAxis tick={textColor} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Gender Diversity (Donut) */}
          <AnimatedCard delay={0.6}>
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

          {/* Employee Growth Trend (Line Chart) */}
          <AnimatedCard delay={0.7}>
            <h3 style={{ marginBottom: '20px' }}>Hiring Growth Trend</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.employeeGrowthTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={textColor} axisLine={false} tickLine={false} />
                  <YAxis tick={textColor} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Leave Status Analysis (Bar Chart) */}
          <AnimatedCard delay={0.8}>
            <h3 style={{ marginBottom: '20px' }}>Leave Status Analysis</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.leaveStatusAnalysis} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={textColor} axisLine={false} tickLine={false} />
                  <YAxis tick={textColor} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--panel-bg-solid)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

        </div>
      )}
    </div>
  );
}
