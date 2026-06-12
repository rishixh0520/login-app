import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api';
import {
  Banknote, Download, Plus, Search, Filter, Trash2, Edit, Printer, FileSpreadsheet, X, Eye, TrendingDown, TrendingUp
} from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import ModernTable from '../components/ModernTable';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Payroll() {
  const { user } = useSelector((state) => state.auth);
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  const [activeTab, setActiveTab] = useState(isAdminOrHR ? 'dashboard' : 'my_salary');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Payroll Management</h1>
          <p>Manage salaries, deductions, and financial reports</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--success)', color: 'white', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
          <Banknote size={18} /> Active Payroll
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {isAdminOrHR && (
          <>
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Banknote size={16} />} label="Overview" />
            <TabButton active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Edit size={16} />} label="Manage Salaries" />
            <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileSpreadsheet size={16} />} label="Reports" />
          </>
        )}
        <TabButton active={activeTab === 'my_salary'} onClick={() => setActiveTab('my_salary')} icon={<Eye size={16} />} label="My Salary" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'dashboard' && <PayrollDashboard month={selectedMonth} setMonth={setSelectedMonth} />}
          {activeTab === 'manage' && <PayrollManage />}
          {activeTab === 'reports' && <SalaryReports />}
          {activeTab === 'my_salary' && <MySalary />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
        background: active ? 'var(--primary)' : 'var(--panel-bg)', 
        color: active ? 'white' : 'var(--text-muted)', 
        border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)', 
        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap'
      }}
    >
      {icon} {label}
    </button>
  );
}

// ==========================
// 1. DASHBOARD TAB
// ==========================
function PayrollDashboard({ month, setMonth }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get(`/payroll/dashboard?month=${month}`).then(res => setStats(res.data)).catch(console.error);
  }, [month]);

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payroll data...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', color: 'var(--text-main)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <AnimatedCard delay={0.1} style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Banknote size={20} /></div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>Total Monthly Payroll</h4>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>₹{stats.totalPayroll.toLocaleString('en-IN')}</h2>
        </AnimatedCard>

        <AnimatedCard delay={0.2} style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={20} /></div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>Average Net Salary</h4>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>₹{stats.avgSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
        </AnimatedCard>

        <AnimatedCard delay={0.3} style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={20} /></div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>Total TDS Deducted</h4>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>₹{stats.totalTDS.toLocaleString('en-IN')}</h2>
        </AnimatedCard>

        <AnimatedCard delay={0.4} style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Banknote size={20} /></div>
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>Other Deductions</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PF</span> <strong style={{ fontSize: '1.2rem' }}>₹{stats.totalPF.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>ESI</span> <strong style={{ fontSize: '1.2rem' }}>₹{stats.totalESI.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

// ==========================
// 2. MANAGE TAB
// ==========================
function PayrollManage() {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    salary_month: new Date().toISOString().slice(0, 7),
    basic_salary: '', hra: '', da: '', bonus: '0'
  });

  const fetchData = () => {
    api.get('/employees').then(res => setEmployees(res.data)).catch(console.error);
    api.get('/payroll').then(res => setSalaries(res.data)).catch(console.error);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditRecord(null); setFormData({ employee_id: employees[0]?.id || '', salary_month: new Date().toISOString().slice(0, 7), basic_salary: '', hra: '', da: '', bonus: '0' }); setIsModalOpen(true); };
  
  const openEdit = (record) => {
    setEditRecord(record);
    setFormData({
      employee_id: record.employee_id,
      salary_month: record.salary_month,
      basic_salary: record.basic_salary,
      hra: record.hra,
      da: record.da,
      bonus: record.bonus
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    try {
      await api.delete(`/payroll/${id}`);
      toast.success("Record deleted");
      fetchData();
    } catch (error) { toast.error("Error deleting record"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editRecord) await api.put(`/payroll/${editRecord.id}`, formData);
      else await api.post('/payroll', formData);
      setIsModalOpen(false);
      toast.success("Salary saved successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving salary");
    }
  };

  const columns = [
    { header: 'Month', accessor: 'salary_month' },
    { header: 'Employee Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Gross Salary', render: (row) => `₹${Number(row.gross_salary).toLocaleString('en-IN')}` },
    { header: 'Deductions', render: (row) => `₹${(Number(row.pf) + Number(row.esi) + Number(row.tds)).toLocaleString('en-IN')}` },
    { header: 'Net Salary', render: (row) => <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{Number(row.net_salary).toLocaleString('en-IN')}</span> },
    { header: 'Actions', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => openEdit(row)} title="Edit"><Edit size={14} /></button>
        <button className="btn-secondary" style={{ padding: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(row.id)} title="Delete"><Trash2 size={14} /></button>
      </div>
    )}
  ];

  return (
    <AnimatedCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Manage Employee Salaries</h3>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Salary</button>
      </div>

      <ModernTable columns={columns} data={salaries} searchable={true} itemsPerPage={10} />

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}
            >
              <button style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
              <h3 style={{ marginBottom: '1.5rem' }}>{editRecord ? 'Edit Salary' : 'Add Salary'}</h3>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!editRecord && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Employee</label>
                    <select required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} style={{ width: '100%' }}>
                      <option value="">Select Employee</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employee_name || emp.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Month</label>
                  <input type="month" required value={formData.salary_month} onChange={e => setFormData({...formData, salary_month: e.target.value})} disabled={!!editRecord} style={{ width: '100%' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Basic Salary (₹)</label>
                    <input type="number" required value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>HRA (₹)</label>
                    <input type="number" required value={formData.hra} onChange={e => setFormData({...formData, hra: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>DA (₹)</label>
                    <input type="number" required value={formData.da} onChange={e => setFormData({...formData, da: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Bonus (₹)</label>
                    <input type="number" value={formData.bonus} onChange={e => setFormData({...formData, bonus: e.target.value})} />
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  * Deductions (PF, ESI, TDS) will be calculated automatically based on inputs.
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Salary</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedCard>
  );
}

// ==========================
// 3. REPORTS TAB
// ==========================
function SalaryReports() {
  const [salaries, setSalaries] = useState([]);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);

  const fetchReports = () => {
    let url = '/payroll';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (month) params.append('month', month);
    if (params.toString()) url += `?${params.toString()}`;

    api.get(url).then(res => setSalaries(res.data)).catch(console.error);
  };

  useEffect(() => { fetchReports(); }, [search, month]);

  const exportCSV = () => {
    const headers = ['Month', 'Employee ID', 'Name', 'Department', 'Designation', 'Basic', 'HRA', 'DA', 'Bonus', 'Gross Salary', 'PF', 'ESI', 'TDS', 'Net Salary'];
    const rows = salaries.map(s => [
      s.salary_month, s.employee_id, s.name, s.department_name, s.designation,
      s.basic_salary, s.hra, s.da, s.bonus, s.gross_salary, s.pf, s.esi, s.tds, s.net_salary
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Salary_Report_${month || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("CSV Downloaded");
  };

  const columns = [
    { header: 'Month', accessor: 'salary_month' },
    { header: 'Name & Role', render: (row) => (
      <div>
        <strong style={{ display: 'block' }}>{row.name}</strong>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.designation}</span>
      </div>
    )},
    { header: 'Department', render: (row) => <span className="status-badge" style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>{row.department_name}</span> },
    { header: 'Gross Salary', render: (row) => `₹${Number(row.gross_salary).toLocaleString('en-IN')}` },
    { header: 'Net Salary', render: (row) => <strong style={{ color: 'var(--success)' }}>₹{Number(row.net_salary).toLocaleString('en-IN')}</strong> },
    { header: 'Action', render: (row) => <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setSelectedSlip(row)}><Eye size={14} /> Slip</button> }
  ];

  return (
    <AnimatedCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
          </div>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={exportCSV}><FileSpreadsheet size={16} /> Export CSV</button>
      </div>

      <ModernTable columns={columns} data={salaries} searchable={false} itemsPerPage={10} />

      {selectedSlip && <SalarySlip record={selectedSlip} onClose={() => setSelectedSlip(null)} />}
    </AnimatedCard>
  );
}

// ==========================
// 4. MY SALARY TAB (EMPLOYEES)
// ==========================
function MySalary() {
  const [salaries, setSalaries] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    api.get('/payroll/my-salary').then(res => setSalaries(res.data)).catch(console.error);
  }, []);

  const columns = [
    { header: 'Month', accessor: 'salary_month' },
    { header: 'Gross Salary', render: (row) => `₹${Number(row.gross_salary).toLocaleString('en-IN')}` },
    { header: 'Net Salary', render: (row) => <strong style={{ color: 'var(--success)' }}>₹{Number(row.net_salary).toLocaleString('en-IN')}</strong> },
    { header: 'Payslip', render: (row) => <button className="btn-primary" style={{ padding: '6px 12px' }} onClick={() => setSelectedSlip(row)}><Printer size={14} /> View Slip</button> }
  ];

  return (
    <AnimatedCard>
      <h3 style={{ marginBottom: '1.5rem' }}>My Salary History</h3>
      <ModernTable columns={columns} data={salaries} searchable={false} itemsPerPage={10} />
      {selectedSlip && <SalarySlip record={selectedSlip} onClose={() => setSelectedSlip(null)} />}
    </AnimatedCard>
  );
}

// ==========================
// 5. SALARY SLIP MODAL
// ==========================
function SalarySlip({ record, onClose }) {
  const handlePrint = () => {
    const printContent = document.getElementById('printable-slip').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '12px', padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#111827' }}>Salary Slip - {record.salary_month}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={handlePrint}><Printer size={16} /> Print</button>
            <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}><X size={18} /></button>
          </div>
        </div>

        <div id="printable-slip" style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, color: '#1f2937', letterSpacing: '1px' }}>i-SOFTZONE IT SOLUTIONS</h1>
            <p style={{ margin: '5px 0', color: '#4b5563' }}>123 Tech Park, Innovation Hub, India</p>
            <h3 style={{ margin: '15px 0 0 0', textDecoration: 'underline', color: '#374151' }}>PAYSLIP FOR {record.salary_month}</h3>
          </div>

          <table style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
            <tbody>
              <tr>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600 }}>Employee Name</td>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>{record.name}</td>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600 }}>Employee ID</td>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>EMP-{String(record.employee_id).padStart(4, '0')}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600 }}>Department</td>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>{record.department_name}</td>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600 }}>Designation</td>
                <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>{record.designation}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ background: '#f3f4f6', padding: '12px 15px', margin: 0, border: '1px solid #e5e7eb', borderBottom: 'none', color: '#1f2937' }}>EARNINGS</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>Basic Salary</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.basic_salary).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>HRA</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.hra).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>DA</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.da).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>Bonus</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.bonus).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '12px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 700 }}>Gross Earnings</td><td style={{ padding: '12px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', textAlign: 'right', fontWeight: 700 }}>₹{Number(record.gross_salary).toLocaleString('en-IN')}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ background: '#f3f4f6', padding: '12px 15px', margin: 0, border: '1px solid #e5e7eb', borderBottom: 'none', color: '#1f2937' }}>DEDUCTIONS</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>Provident Fund (PF)</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.pf).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>ESI</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.esi).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>TDS</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{Number(record.tds).toLocaleString('en-IN')}</td></tr>
                  <tr><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>&nbsp;</td><td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>&nbsp;</td></tr>
                  <tr><td style={{ padding: '12px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 700 }}>Total Deductions</td><td style={{ padding: '12px 15px', border: '1px solid #e5e7eb', background: '#f9fafb', textAlign: 'right', fontWeight: 700 }}>₹{(Number(record.pf) + Number(record.esi) + Number(record.tds)).toLocaleString('en-IN')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#166534' }}>NET PAYABLE SALARY</h3>
            <h2 style={{ margin: 0, color: '#15803d', fontSize: '2rem' }}>₹{Number(record.net_salary).toLocaleString('en-IN')}</h2>
          </div>
          
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '10px', width: '200px', textAlign: 'center', color: '#4b5563', fontWeight: 500 }}>Employer Signature</div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '10px', width: '200px', textAlign: 'center', color: '#4b5563', fontWeight: 500 }}>Employee Signature</div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '40px' }}>This is a computer generated document. No signature is required.</p>
        </div>
      </motion.div>
    </div>
  );
}
