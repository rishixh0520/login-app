import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Joins() {
  const [join1, setJoin1] = useState([]);
  const [join2, setJoin2] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [j1, j2] = await Promise.all([
          api.get('/reports/join1'),
          api.get('/reports/join2'),
        ]);
        setJoin1(j1.data);
        setJoin2(j2.data);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Failed to load join data');
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>SQL Joins</h1>
        <p>Department and skills joins</p>
      </header>

      {message && <div className="alert">{message}</div>}

      <div className="card">
        <h3>Join 1: Employees & Departments</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {join1.map((row, i) => (
              <tr key={i}>
                <td>{row.name}</td>
                <td>{row.department_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Join 2: Employees & Skills</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Skill</th>
            </tr>
          </thead>
          <tbody>
            {join2.map((row, i) => (
              <tr key={i}>
                <td>{row.name}</td>
                <td>{row.skill_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
