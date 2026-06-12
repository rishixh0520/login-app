import React, { useEffect, useState } from 'react';
import { api } from '../api';
import AnimatedCard from '../components/AnimatedCard';
import ModernTable from '../components/ModernTable';
import { Database, Link } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Joins() {
  const [join1, setJoin1] = useState([]);
  const [join2, setJoin2] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [j1, j2] = await Promise.all([
          api.get('/reports/join1'),
          api.get('/reports/join2'),
        ]);
        setJoin1(j1.data);
        setJoin2(j2.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load join data');
      }
    };
    load();
  }, []);

  const cols1 = [
    { header: 'Employee Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Department Name', render: (row) => <span className="status-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.department_name}</span> }
  ];

  const cols2 = [
    { header: 'Employee Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Assigned Skill', render: (row) => <span style={{ padding: '4px 10px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.85rem' }}>{row.skill_name}</span> }
  ];

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Data Joins</h1>
          <p>View relations between employees, departments, and skills</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
          <Database size={18} /> SQL Reports
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <AnimatedCard delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Link size={20} /></div>
            <h3 style={{ margin: 0 }}>Join 1: Employees & Departments</h3>
          </div>
          <ModernTable columns={cols1} data={join1} searchable={false} itemsPerPage={10} />
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Link size={20} /></div>
            <h3 style={{ margin: 0 }}>Join 2: Employees & Skills</h3>
          </div>
          <ModernTable columns={cols2} data={join2} searchable={false} itemsPerPage={10} />
        </AnimatedCard>
      </div>
    </div>
  );
}
