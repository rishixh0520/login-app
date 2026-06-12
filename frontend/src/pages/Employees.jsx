import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE_URL } from '../api';
import { useSelector } from 'react-redux';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import AnimatedCard from '../components/AnimatedCard';
import ModernTable from '../components/ModernTable';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Users, Pencil, Trash2, X, Search, Filter,
  Briefcase, Phone, MapPin, DollarSign, ChevronDown, ChevronUp, Shield, Eye, List, Grid
} from 'lucide-react';

export default function Employees() {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || 'employee';
  const canDelete = role === 'admin' || role === 'manager';

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [form, setForm] = useState({
    user_id: '', department_id: '', phone: '', address: '', designation: '', salary: '',
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const editingEmployee = useMemo(
    () => employees.find((e) => e.id === editingId),
    [employees, editingId]
  );

  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) => {
        const matchesSearch = e.employee_name?.toLowerCase().includes(q) ||
                              e.designation?.toLowerCase().includes(q) ||
                              e.department_name?.toLowerCase().includes(q);
        const matchesDept = filterDept ? e.department_id?.toString() === filterDept : true;
        return matchesSearch && matchesDept;
      }
    );
  }, [employees, search, filterDept]);

  const loadData = async () => {
    try {
      const [empRes, depRes, skillRes, userRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/skills'),
        api.get('/employees/users/available'),
      ]);
      setEmployees(empRes.data);
      setDepartments(depRes.data);
      setSkills(skillRes.data);
      setAvailableUsers(userRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load employees');
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ user_id: '', department_id: '', phone: '', address: '', designation: '', salary: '' });
    setSelectedSkills([]);
    setImageUrls([]);
    setFiles([]);
    setEditingId(null);
    setShowForm(false);
  };

  const toggleSkill = (id) => {
    setSelectedSkills((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const uploadImages = async () => {
    if (!files.length) return imageUrls;
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const res = await api.post('/employees/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uploaded = await uploadImages();
      const payload = {
        department_id: form.department_id || null,
        phone: form.phone,
        address: form.address,
        designation: form.designation,
        salary: form.salary || null,
        skills: selectedSkills,
        images: uploaded,
      };
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        toast.success('Employee updated successfully.');
      } else {
        if (!form.user_id) { setLoading(false); return toast.error('Select a user to create a profile.'); }
        await api.post('/employees', { ...payload, user_id: form.user_id });
        toast.success('Employee created successfully.');
      }
      await loadData();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      user_id: emp.user_id,
      department_id: emp.department_id || '',
      phone: emp.phone || '',
      address: emp.address || '',
      designation: emp.designation || '',
      salary: emp.salary || '',
    });
    setSelectedSkills(emp.skills?.map((s) => s.id) || []);
    setImageUrls(emp.images?.map((i) => i.image_url) || []);
    setFiles([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setDeleteConfirm(null);
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const tableColumns = [
    { header: 'Employee', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
          {row.employee_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <strong style={{ display: 'block' }}>{row.employee_name}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.employee_email}</span>
        </div>
      </div>
    )},
    { header: 'Designation', accessor: 'designation' },
    { header: 'Department', render: (row) => (
      row.department_name ? <span className="status-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{row.department_name}</span> : '—'
    )},
    { header: 'Actions', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => navigate(`/employees/${row.id}`)} title="View Profile"><Eye size={14} /></button>
        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEdit(row)} title="Edit"><Pencil size={14} /></button>
        {canDelete && <button className="btn-danger" style={{ padding: '6px' }} onClick={() => setDeleteConfirm(row.id)} title="Delete"><Trash2 size={14} /></button>}
      </div>
    )}
  ];

  return (
    <div>
      {/* Page Header */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Directory</h1>
          <p>{employees.length} team member{employees.length !== 1 ? 's' : ''} · Manage profiles, skills & records</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
        >
          <UserPlus size={16} />
          {showForm && !editingId ? 'Cancel' : 'Add Employee'}
        </button>
      </header>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card" style={{ maxWidth: '400px', width: '100%' }}
            >
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ marginBottom: '8px' }}>Delete Employee?</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This action cannot be undone. Are you sure you want to permanently remove this profile?</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            style={{ overflow: 'hidden', marginBottom: '2rem' }}
          >
            <AnimatedCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingId ? <><Pencil size={18} /> Edit Employee</> : <><UserPlus size={18} /> New Employee Profile</>}
                </h3>
                <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={resetForm}>
                  <X size={14} /> Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="form-grid">
                {!editingId && (
                  <FormSelect
                    label="Link to User Account"
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    options={availableUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                  />
                )}
                {editingId && (
                  <FormInput
                    label="User"
                    value={`${editingEmployee?.employee_name || ''} ${editingEmployee?.employee_email ? `(${editingEmployee.employee_email})` : ''}`}
                    onChange={() => {}}
                    disabled
                  />
                )}

                <FormSelect
                  label="Department"
                  value={form.department_id || ''}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  options={departments.map((d) => ({ value: d.id, label: d.department_name }))}
                />

                <FormInput label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                <FormInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <FormInput label="Salary (₹)" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />

                <div className="input-group full">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Address</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Country" />
                </div>

                <div className="input-group full">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Skills</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {skills.map((s) => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: selectedSkills.includes(s.id) ? 'var(--primary-light)' : 'var(--bg-color)', border: `1px solid ${selectedSkills.includes(s.id) ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', color: selectedSkills.includes(s.id) ? 'var(--primary)' : 'var(--text-main)' }}>
                        <input type="checkbox" style={{ display: 'none' }} checked={selectedSkills.includes(s.id)} onChange={() => toggleSkill(s.id)} />
                        {s.skill_name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group full">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Upload Photos <span style={{ color: 'var(--text-soft)', fontWeight: 400 }}>(max 5)</span></label>
                  <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} style={{ padding: '8px', background: 'var(--bg-color)' }} />
                  {imageUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {imageUrls.map((url, i) => (
                        <img key={i} src={`${API_BASE_URL}${url}`} alt="employee" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="full" style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingId ? 'Update Employee' : 'Create Employee Profile')}
                  </button>
                </div>
              </form>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px', background: 'var(--panel-bg)', backdropFilter: 'blur(10px)', width: '100%' }}
            />
          </div>
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Filter size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select 
              value={filterDept} 
              onChange={(e) => setFilterDept(e.target.value)}
              style={{ paddingLeft: '40px', background: 'var(--panel-bg)', backdropFilter: 'blur(10px)', width: '100%', appearance: 'none' }}
              className="form-input"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.department_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--panel-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button onClick={() => setViewMode('grid')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? 'var(--primary-light)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
            <Grid size={16} /> Grid
          </button>
          <button onClick={() => setViewMode('table')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'table' ? 'var(--primary-light)' : 'transparent', color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
            <List size={16} /> Table
          </button>
        </div>
      </div>

      {!canDelete && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <Shield size={16} />
          <span style={{ fontSize: '0.9rem' }}>You are viewing as <strong>{role}</strong>. Only admins and managers can delete records.</span>
        </div>
      )}

      {/* Employee List */}
      {viewMode === 'table' ? (
        <ModernTable columns={tableColumns} data={filteredEmployees} searchable={false} itemsPerPage={10} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredEmployees.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              No employees found {search ? 'matching your search' : ''}.
            </div>
          )}
          {filteredEmployees.map((e, index) => {
            const initials = e.employee_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <AnimatedCard key={e.id} delay={index * 0.05} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '1.1rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.employee_name}</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.designation || 'No Designation'}</span>
                      {e.department_name && <span className="status-badge" style={{ width: 'fit-content', background: 'var(--primary-light)', color: 'var(--primary)' }}>{e.department_name}</span>}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/employees/${e.id}`)} style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }} title="View Profile">
                    <Eye size={16} />
                  </button>
                </div>



                <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)', background: 'var(--bg-color)', padding: '12px' }}>
                  <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, transition: 'color 0.2s' }} onClick={() => navigate(`/employees/${e.id}`)}><Eye size={16} /> Profile</button>
                  <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'color 0.2s' }} onClick={() => handleEdit(e)}><Pencil size={16} /> Edit</button>
                  {canDelete && (
                    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500, transition: 'opacity 0.2s' }} onClick={() => setDeleteConfirm(e.id)}><Trash2 size={16} /> Delete</button>
                  )}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
