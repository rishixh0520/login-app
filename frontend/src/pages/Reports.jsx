import React, { useState } from 'react';
import { api } from '../api';
import { FileDown, FileText, FileSpreadsheet, DownloadCloud } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(null);

  const handleDownload = async (type, format) => {
    try {
      setLoading(`${type}-${format}`);
      const res = await api.get(`/advanced-reports/export?type=${type}&format=${format}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let extension = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `${type}_report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Report downloaded successfully`);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  const reportTypes = [
    { id: 'employees', name: 'Employee Directory', desc: 'Complete list of all employees, departments, and designations.', icon: '👥', color: 'var(--primary)' },
    { id: 'attendance', name: 'Attendance Report', desc: 'Historical clock-in and clock-out logs across all departments.', icon: '🕒', color: 'var(--success)' },
    { id: 'leaves', name: 'Leave Applications', desc: 'History of leave requests, statuses, and durations.', icon: '📅', color: 'var(--accent)' },
    { id: 'payroll', name: 'Payroll Report', desc: 'Gross and net salaries, taxes, and deductions by month.', icon: '💵', color: 'var(--danger)' },
    { id: 'department', name: 'Department Analysis', desc: 'Aggregate metrics grouped by company departments.', icon: '🏢', color: 'var(--primary)' },
    { id: 'performance', name: 'Performance Review', desc: 'Employee performance ratings and designations.', icon: '⭐', color: 'var(--warning)' },
  ];

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Enterprise Reports</h1>
          <p>Export business intelligence data to PDF, Excel, or CSV</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
          <DownloadCloud size={18} /> Export Center
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {reportTypes.map((rt, index) => (
          <AnimatedCard key={rt.id} delay={index * 0.1} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${rt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                {rt.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{rt.name}</h3>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', margin: 0, flex: 1 }}>{rt.desc}</p>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 0', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--text-main)' }} 
                onClick={() => handleDownload(rt.id, 'pdf')}
                disabled={loading === `${rt.id}-pdf`}
              >
                <FileText size={16} style={{ color: 'var(--danger)' }} /> {loading === `${rt.id}-pdf` ? '...' : 'PDF'}
              </button>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 0', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--text-main)' }} 
                onClick={() => handleDownload(rt.id, 'excel')}
                disabled={loading === `${rt.id}-excel`}
              >
                <FileSpreadsheet size={16} style={{ color: 'var(--success)' }} /> {loading === `${rt.id}-excel` ? '...' : 'Excel'}
              </button>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 0', borderColor: 'rgba(59, 130, 246, 0.3)', color: 'var(--text-main)' }} 
                onClick={() => handleDownload(rt.id, 'csv')}
                disabled={loading === `${rt.id}-csv`}
              >
                <FileDown size={16} style={{ color: 'var(--primary)' }} /> {loading === `${rt.id}-csv` ? '...' : 'CSV'}
              </button>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
