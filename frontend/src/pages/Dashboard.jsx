import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, Building2, BookOpen, Image as ImageIcon, Clock3, BadgeCheck, Ban, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    employees: 0, departments: 0, skills: 0, images: 0, leaves: 0, 
    pendingApprovals: 0, approvedLeaves: 0, rejectedLeaves: 0, totalSalary: 0,
    presentToday: 0, absentToday: 0, attendancePercentage: 0
  });

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
    { label: 'Pending Leaves', value: stats.pendingApprovals, icon: Clock3, color: 'orange' },
    { label: 'Approved Leaves', value: stats.approvedLeaves, icon: BadgeCheck, color: 'green' },
    { label: 'Rejected Leaves', value: stats.rejectedLeaves, icon: Ban, color: 'red' },
    { label: 'Total Salary Expense', value: `₹${Number(stats.totalSalary).toLocaleString('en-IN')}`, icon: Sparkles, color: 'purple' },
    { label: 'Present Today', value: stats.presentToday, icon: Users, color: 'green' },
    { label: 'Absent Today', value: stats.absentToday, icon: Users, color: 'red' },
    { label: 'Attendance %', value: `${stats.attendancePercentage}%`, icon: BadgeCheck, color: 'blue' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const departmentData = [
    { name: 'IT', value: 40 },
    { name: 'HR', value: 20 },
    { name: 'Finance', value: 15 },
    { name: 'Marketing', value: 25 },
  ];

  const hiringTrendData = [
    { month: 'Jan', hires: 4 },
    { month: 'Feb', hires: 7 },
    { month: 'Mar', hires: 2 },
    { month: 'Apr', hires: 10 },
    { month: 'May', hires: 6 },
    { month: 'Jun', hires: 15 },
  ];

  return (
    <div className="page-container">
      <header className="page-header dashboard-header">
        <div>
          <h1>Enterprise Dashboard</h1>
          <p>Advanced Overview of the ERP System</p>
        </div>
      </header>

      <div className="stats-grid stats-grid-wide" style={{ marginBottom: '2rem' }}>
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

      <div className="stats-grid stats-grid-wide">
        <div className="card">
          <h3>Department Wise Count (Pie)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Hiring Trend (Area)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hiringTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="hires" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Leave Status (Bar)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Pending', count: stats.pendingApprovals },
                { name: 'Approved', count: stats.approvedLeaves },
                { name: 'Rejected', count: stats.rejectedLeaves }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Employee Growth (Line)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hiringTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="hires" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
