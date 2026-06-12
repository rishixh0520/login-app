import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Trophy, ArrowDown, UserPlus, Clock3, Star } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import SkeletonLoader from '../components/SkeletonLoader';
import ModernTable from '../components/ModernTable';

export default function ManagerInsights() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ 
    highestPaid: [], topPerformers: [], recentJoiners: [], mostLeaves: [] 
  });

  useEffect(() => {
    api.get('/analytics/manager-insights')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load manager insights", err);
        setLoading(false);
      });
  }, []);

  const highestPaidColumns = [
    { header: 'Employee', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Salary', render: (row) => `₹${Number(row.salary).toLocaleString()}` }
  ];

  const topPerformersColumns = [
    { header: 'Employee', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Rating', render: (row) => (
      <div style={{ display: 'flex', gap: '4px', color: '#f59e0b' }}>
        {Array(row.performance_rating).fill(0).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
      </div>
    )}
  ];

  const mostLeavesColumns = [
    { header: 'Employee', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Total Leaves Taken', render: (row) => <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{row.total_leaves}</span> }
  ];

  const recentJoinersColumns = [
    { header: 'Employee', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Join Date', render: (row) => new Date(row.join_date).toLocaleDateString() }
  ];

  return (
    <div>
      <header className="page-header">
        <h1>Manager Insights</h1>
        <p>Actionable metrics and top lists for decision making</p>
      </header>

      {loading ? (
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
          <SkeletonLoader type="card" count={4} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))' }}>
          
          <AnimatedCard delay={0.1}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Trophy size={20} color="#f59e0b" /> Top Performers (5 Stars)
            </h3>
            <ModernTable columns={topPerformersColumns} data={data.topPerformers} searchable={false} itemsPerPage={5} />
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowDown size={20} color="#ef4444" /> Most Leaves Taken
            </h3>
            <ModernTable columns={mostLeavesColumns} data={data.mostLeaves} searchable={false} itemsPerPage={5} />
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <UserPlus size={20} color="#10b981" /> Recent Joiners
            </h3>
            <ModernTable columns={recentJoinersColumns} data={data.recentJoiners} searchable={false} itemsPerPage={5} />
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Trophy size={20} color="#8b5cf6" /> Highest Paid Employees
            </h3>
            <ModernTable columns={highestPaidColumns} data={data.highestPaid} searchable={false} itemsPerPage={5} />
          </AnimatedCard>

        </div>
      )}
    </div>
  );
}
