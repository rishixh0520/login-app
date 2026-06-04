import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, Building2, BookOpen, Image as ImageIcon, Clock3, BadgeCheck, Ban, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ employees: 0, departments: 0, skills: 0, images: 0, leaves: 0, pendingApprovals: 0, approvedLeaves: 0, rejectedLeaves: 0 });

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats((prev) => ({ ...prev, ...res.data })))
      .catch(console.error);
  }, []);

  const cards = [
    { label: 'Total Employees', value: stats.employees, icon: Users, color: 'blue' },
    { label: 'Total Departments', value: stats.departments, icon: Building2, color: 'purple' },
    { label: 'Total Skills', value: stats.skills, icon: BookOpen, color: 'orange' },
    { label: 'Total Images', value: stats.images, icon: ImageIcon, color: 'green' },
    { label: 'Leave Requests', value: stats.leaves, icon: Clock3, color: 'blue' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock3, color: 'orange' },
    { label: 'Approved Leaves', value: stats.approvedLeaves, icon: BadgeCheck, color: 'green' },
    { label: 'Rejected Leaves', value: stats.rejectedLeaves, icon: Ban, color: 'red' },
  ];

  return (
    <div className="page-container">
      <header className="page-header dashboard-header">
        <div>

          <h1>Dashboard</h1>
          <p>Overview of the Employee Management System</p>
        </div>

      </header>

      <div className="stats-grid stats-grid-wide">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`stat-card stat-${c.color}`}>
              <div className="stat-icon"><Icon size={24} /></div>
              <div className="stat-content">
                <h3>{c.value}</h3>
                <p>{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
