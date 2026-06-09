import React from 'react';

export default function FormInput({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
