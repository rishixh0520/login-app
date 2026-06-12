import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Database, Building2, BookOpen, Plus, Tag } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import toast from 'react-hot-toast';

export default function Master() {
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [departmentName, setDepartmentName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [depRes, skillRes] = await Promise.all([
        api.get('/departments'),
        api.get('/skills'),
      ]);
      setDepartments(depRes.data);
      setSkills(skillRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load master data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addDepartment = async (e) => {
    e.preventDefault();
    if (!departmentName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/departments', { department_name: departmentName.trim() });
      setDepartments((prev) => [...prev, res.data].sort((a, b) => a.department_name.localeCompare(b.department_name)));
      setDepartmentName('');
      toast.success('Department added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/skills', { skill_name: skillName.trim() });
      setSkills((prev) => [...prev, res.data].sort((a, b) => a.skill_name.localeCompare(b.skill_name)));
      setSkillName('');
      toast.success('Skill added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Master Data</h1>
          <p>Configure lookup tables, departments, and skills</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
          <Database size={18} /> Settings
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <AnimatedCard delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={20} /></div>
            <h3 style={{ margin: 0 }}>Departments</h3>
          </div>
          
          <form onSubmit={addDepartment} style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <input required type="text" placeholder="New department name..." value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '8px 16px' }}><Plus size={16} /> Add</button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {departments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No departments configured.</div>
            ) : (
              departments.map((d) => (
                <span key={d.id} style={{ padding: '8px 16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Building2 size={14} style={{ color: 'var(--primary)' }} /> {d.department_name}
                </span>
              ))
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={20} /></div>
            <h3 style={{ margin: 0 }}>Skills Map</h3>
          </div>
          
          <form onSubmit={addSkill} style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <input required type="text" placeholder="New skill name..." value={skillName} onChange={(e) => setSkillName(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '8px 16px' }}><Plus size={16} /> Add</button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {skills.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No skills configured.</div>
            ) : (
              skills.map((s) => (
                <span key={s.id} style={{ padding: '8px 16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Tag size={14} style={{ color: 'var(--accent)' }} /> {s.skill_name}
                </span>
              ))
            )}
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
