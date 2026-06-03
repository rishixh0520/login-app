import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Master() {
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [departmentName, setDepartmentName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [depRes, skillRes] = await Promise.all([
        api.get('/departments'),
        api.get('/skills'),
      ]);
      setDepartments(depRes.data);
      setSkills(skillRes.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load master data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addDepartment = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!departmentName.trim()) return;
    try {
      const res = await api.post('/departments', { department_name: departmentName.trim() });
      setDepartments((prev) => [...prev, res.data].sort((a, b) => a.department_name.localeCompare(b.department_name)));
      setDepartmentName('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add department');
    }
  };

  const addSkill = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!skillName.trim()) return;
    try {
      const res = await api.post('/skills', { skill_name: skillName.trim() });
      setSkills((prev) => [...prev, res.data].sort((a, b) => a.skill_name.localeCompare(b.skill_name)));
      setSkillName('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add skill');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Master Data</h1>
        <p>Manage departments and skills</p>
      </header>

      {message && <div className="alert">{message}</div>}

      <div className="two-col">
        <div className="card">
          <h3>Departments</h3>
          <form className="inline-form" onSubmit={addDepartment}>
            <input
              placeholder="New department"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Add</button>
          </form>
          <div className="pill-group">
            {departments.map((d) => (
              <span key={d.id} className="pill">{d.department_name}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Skills</h3>
          <form className="inline-form" onSubmit={addSkill}>
            <input
              placeholder="New skill"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Add</button>
          </form>
          <div className="pill-group">
            {skills.map((s) => (
              <span key={s.id} className="pill">{s.skill_name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
