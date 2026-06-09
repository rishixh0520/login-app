import React, { useState } from 'react';
import { api } from '../api';
import { Search } from 'lucide-react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      try {
        const res = await api.get(`/search?q=${val}`);
        setResults(res.data.data);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
        <Search size={18} style={{ color: 'var(--text-tertiary)', marginRight: '0.5rem' }} />
        <input 
          type="text" 
          value={query} 
          onChange={handleSearch} 
          placeholder="Global search (Name, Email, Skill)..."
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          marginTop: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {results.map(r => (
            <div key={r.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ display: 'block' }}>{r.name}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.department_name} - {r.designation}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
