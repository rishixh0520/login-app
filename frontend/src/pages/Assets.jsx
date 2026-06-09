import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DynamicForm } from '../components/DynamicForm';
import { Package, Laptop, Activity } from 'lucide-react';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [message, setMessage] = useState('');
  const role = localStorage.getItem('role') || 'employee';

  const loadData = async () => {
    try {
      const [assetsRes, empRes] = await Promise.all([
        api.get('/assets'),
        api.get('/employees') // Reusing existing endpoint
      ]);
      setAssets(assetsRes.data.data || assetsRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      setMessage('Failed to load assets data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', formValues);
      setMessage('Asset created successfully');
      setFormValues({});
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create asset');
    }
  };

  const handleAllocate = async (assetId) => {
    const employeeId = prompt('Enter Employee ID to allocate:');
    if (!employeeId) return;
    try {
      await api.post(`/assets/${assetId}/allocate`, { employee_id: employeeId, allocated_date: new Date().toISOString().split('T')[0] });
      setMessage('Asset allocated');
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Allocation failed');
    }
  };

  const handleReturn = async (assetId) => {
    try {
      await api.post(`/assets/${assetId}/return`, { return_date: new Date().toISOString().split('T')[0], status: 'Available', remarks: 'Returned normally' });
      setMessage('Asset returned');
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Return failed');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Asset Management</h1>
          <p>Track hardware and software licenses</p>
        </div>
      </header>

      {message && <div className="alert">{message}</div>}

      {['admin', 'hr', 'manager'].includes(role) && (
        <div className="card">
          <h3>Add New Asset</h3>
          <DynamicForm
            fields={[
              { name: 'asset_code', label: 'Asset Code', type: 'text', required: true },
              { name: 'asset_name', label: 'Asset Name', type: 'text', required: true },
              { name: 'asset_type', label: 'Type', type: 'select', options: [{label:'Laptop', value:'Laptop'}, {label:'Monitor', value:'Monitor'}, {label:'Mouse', value:'Mouse'}, {label:'License', value:'License'}], required: true },
              { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: true },
              { name: 'purchase_cost', label: 'Cost', type: 'number', required: true },
            ]}
            values={formValues}
            onChange={(e) => setFormValues({...formValues, [e.target.name]: e.target.value})}
            onSubmit={handleAssetSubmit}
            submitLabel="Create Asset"
          />
        </div>
      )}

      <div className="card">
        <h3>Asset Inventory</h3>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.id}>
                <td>{a.asset_code}</td>
                <td>{a.asset_name}</td>
                <td>{a.asset_type}</td>
                <td><span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
                <td>
                  {a.status === 'Available' && <button className="btn-primary btn-small" onClick={() => handleAllocate(a.id)}>Allocate</button>}
                  {a.status === 'Allocated' && <button className="btn-secondary btn-small" onClick={() => handleReturn(a.id)}>Return</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
