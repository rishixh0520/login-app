import React from 'react';

export default function FormSelect({ label, name, value, onChange, options, required = false }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <select name={name} value={value} onChange={onChange} required={required}>
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value || opt.id}>{opt.label || opt.name}</option>
        ))}
      </select>
    </div>
  );
}
