import React, { useState } from 'react';
import { api } from '../api';
import { FileDown, FileText, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
  const [message, setMessage] = useState('');

  const handleDownload = async (type, format) => {
    try {
      setMessage(`Generating ${format.toUpperCase()} report...`);
      const res = await api.get(`/advanced-reports/export?type=${type}&format=${format}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let extension = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `${type}_report.${extension}`);
      document.body.appendChild(link);
      link.click();
      setMessage(`Report downloaded successfully`);
    } catch (error) {
      setMessage('Failed to generate report');
    }
  };

  const reportTypes = [
    { id: 'employees', name: 'Employee Directory', desc: 'List of all employees with their details.' },
    { id: 'assets', name: 'Asset Inventory', desc: 'Current status of all company assets.' },
    { id: 'leaves', name: 'Leave Applications', desc: 'History of leave requests and statuses.' }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Enterprise Reports</h1>
          <p>Export data to PDF, Excel, or CSV</p>
        </div>
      </header>

      {message && <div className="alert">{message}</div>}

      <div className="stats-grid">
        {reportTypes.map(rt => (
          <div key={rt.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3>{rt.name}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{rt.desc}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary btn-small" onClick={() => handleDownload(rt.id, 'pdf')}><FileText size={16}/> PDF</button>
              <button className="btn-secondary btn-small" onClick={() => handleDownload(rt.id, 'excel')}><FileSpreadsheet size={16}/> Excel</button>
              <button className="btn-secondary btn-small" onClick={() => handleDownload(rt.id, 'csv')}><FileDown size={16}/> CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
