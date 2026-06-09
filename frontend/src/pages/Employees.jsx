import React, { useEffect, useMemo, useState } from 'react';
import { api, API_BASE_URL } from '../api';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [form, setForm] = useState({
    user_id: '',
    department_id: '',
    phone: '',
    address: '',
    designation: '',
    salary: '',
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const editingEmployee = useMemo(
    () => employees.find((e) => e.id === editingId),
    [employees, editingId]
  );

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
      setMessage(error.response?.data?.message || 'Failed to load employees');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ user_id: '', department_id: '', phone: '', address: '', designation: '', salary: '' });
    setSelectedSkills([]);
    setImageUrls([]);
    setFiles([]);
    setEditingId(null);
    setMessage('');
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
    setMessage('');
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
        setMessage('Employee updated');
      } else {
        if (!form.user_id) {
          setLoading(false);
          return setMessage('Select a user to create a profile');
        }
        await api.post('/employees', { ...payload, user_id: form.user_id });
        setMessage('Employee created');
      }
      await loadData();
      resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save employee');
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
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Employees</h1>
        <p>Create, edit and manage employee profiles</p>
      </header>

      {message && <div className="alert">{message}</div>}

      <div className="card">
        <h3>{editingId ? 'Edit Employee' : 'Create Employee'}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          {!editingId && (
            <FormSelect
              label="User"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              options={availableUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            />
          )}
          {editingId && (
            <FormInput
              label="User"
              value={`${editingEmployee?.employee_name || ''} ${editingEmployee?.employee_email ? `(${editingEmployee.employee_email})` : ''}`}
              onChange={() => {}}
            />
          )}
          
          <FormSelect
            label="Department"
            value={form.department_id || ''}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            options={departments.map(d => ({ value: d.id, label: d.department_name }))}
          />
          
          <FormInput
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />

          <FormInput
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <FormInput
            label="Salary"
            type="number"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
          />
          <div className="input-group full">
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="input-group full">
            <label>Skills</label>
            <div className="checkbox-grid">
              {skills.map((s) => (
                <label key={s.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(s.id)}
                    onChange={() => toggleSkill(s.id)}
                  />
                  {s.skill_name}
                </label>
              ))}
            </div>
          </div>

          <div className="input-group full">
            <label>Upload Images (max 5)</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            {imageUrls.length > 0 && (
              <div className="thumbs">
                {imageUrls.map((url, i) => (
                  <img key={i} className="thumb" src={`${API_BASE_URL}${url}`} alt="employee" />
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update Employee' : 'Create Employee')}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Employee List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Salary</th>
              <th>Skills</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.employee_name}</td>
                <td>{e.department_name || '-'}</td>
                <td>{e.designation || '-'}</td>
                <td>{e.salary || '-'}</td>
                <td>
                  <div className="pill-group">
                    {(e.skills || []).map((s) => (
                      <span key={s.id} className="pill">{s.skill_name}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="thumbs">
                    {(e.images || []).map((img) => (
                      <img key={img.id} className="thumb" src={`${API_BASE_URL}${img.image_url}`} alt="employee" />
                    ))}
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-secondary" onClick={() => handleEdit(e)}>Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(e.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
