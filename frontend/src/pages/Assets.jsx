import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Package, Laptop, Activity, Plus, CheckCircle, RefreshCcw } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import ModernTable from '../components/ModernTable';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formValues, setFormValues] = useState({
    asset_code: '', asset_name: '', asset_type: 'Laptop', purchase_date: '', purchase_cost: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const role = localStorage.getItem('role') || 'employee';

  const loadData = async () => {
    try {
      const [assetsRes, empRes] = await Promise.all([
        api.get('/assets'),
        api.get('/employees')
      ]);
      setAssets(assetsRes.data.data || assetsRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      toast.error('Failed to load assets data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', formValues);
      toast.success('Asset created successfully');
      setFormValues({ asset_code: '', asset_name: '', asset_type: 'Laptop', purchase_date: '', purchase_cost: '' });
      setShowAddForm(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create asset');
    }
  };

  const handleAllocate = async (assetId) => {
    const employeeId = window.prompt('Enter Employee ID to allocate (e.g. 1):');
    if (!employeeId) return;
    try {
      await api.post(`/assets/${assetId}/allocate`, { employee_id: employeeId, allocated_date: new Date().toISOString().split('T')[0] });
      toast.success('Asset allocated successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Allocation failed');
    }
  };

  const handleReturn = async (assetId) => {
    try {
      await api.post(`/assets/${assetId}/return`, { return_date: new Date().toISOString().split('T')[0], status: 'Available', remarks: 'Returned normally' });
      toast.success('Asset returned successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Return failed');
    }
  };

  const columns = [
    { header: 'Asset Code', render: (row) => <strong style={{ color: 'var(--primary)' }}>{row.asset_code}</strong> },
    { header: 'Asset Name', accessor: 'asset_name' },
    { header: 'Type', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {row.asset_type === 'Laptop' ? <Laptop size={14} /> : <Package size={14} />}
        {row.asset_type}
      </div>
    )},
    { header: 'Status', render: (row) => (
      <span className={`status-badge ${row.status === 'Available' ? 'approved' : row.status === 'Allocated' ? 'pending' : 'rejected'}`}>
        {row.status}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <div>
        {row.status === 'Available' && <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleAllocate(row.id)}><CheckCircle size={14} /> Allocate</button>}
        {row.status === 'Allocated' && <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleReturn(row.id)}><RefreshCcw size={14} /> Return</button>}
        {row.status !== 'Available' && row.status !== 'Allocated' && <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </div>
    )}
  ];

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Asset Inventory</h1>
          <p>Manage hardware, software licenses, and equipment allocations</p>
        </div>
        {['admin', 'hr', 'manager'].includes(role) && (
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} /> {showAddForm ? 'Cancel' : 'Add New Asset'}
          </button>
        )}
      </header>

      <AnimatePresence>
        {showAddForm && ['admin', 'hr', 'manager'].includes(role) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '2rem' }}>
            <AnimatedCard>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Laptop size={20} /> New Asset Details</h3>
              <form onSubmit={handleAssetSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Asset Code</label>
                  <input required type="text" value={formValues.asset_code} onChange={e => setFormValues({...formValues, asset_code: e.target.value})} placeholder="e.g. LAP-001" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Asset Name</label>
                  <input required type="text" value={formValues.asset_name} onChange={e => setFormValues({...formValues, asset_name: e.target.value})} placeholder="e.g. MacBook Pro M2" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Asset Type</label>
                  <select required value={formValues.asset_type} onChange={e => setFormValues({...formValues, asset_type: e.target.value})} style={{ width: '100%' }}>
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Keyboard">Keyboard</option>
                    <option value="License">License</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Purchase Date</label>
                  <input required type="date" value={formValues.purchase_date} onChange={e => setFormValues({...formValues, purchase_date: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Cost (₹)</label>
                  <input required type="number" value={formValues.purchase_cost} onChange={e => setFormValues({...formValues, purchase_cost: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Asset</button>
                </div>
              </form>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={20} /> Organization Assets</h3>
        </div>
        <ModernTable columns={columns} data={assets} searchable={true} itemsPerPage={10} />
      </AnimatedCard>
    </div>
  );
}
