import React from 'react';

export const FormInput = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", error = "" }) => (
  <div className="input-group">
    <label>{label} {required && <span style={{ color: 'red' }}>*</span>}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={error ? 'input-error' : ''}
    />
    {error && <span className="error-text" style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
  </div>
);

export const FormSelect = ({ label, name, value, onChange, options, required = false, error = "" }) => (
  <div className="input-group">
    <label>{label} {required && <span style={{ color: 'red' }}>*</span>}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={error ? 'input-error' : ''}
    >
      <option value="">Select an option</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <span className="error-text" style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
  </div>
);

export const FormTable = ({ columns, data, onRowAction, actionLabel = "Action" }) => (
  <div className="table-responsive">
    <table>
      <thead>
        <tr>
          {columns.map(col => <th key={col.key}>{col.label}</th>)}
          {onRowAction && <th>{actionLabel}</th>}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
              {onRowAction && (
                <td>
                  <button className="btn-secondary btn-small" onClick={() => onRowAction(row)}>
                    {actionLabel}
                  </button>
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + (onRowAction ? 1 : 0)} className="table-empty">
              No records found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const DynamicForm = ({ title, fields, onSubmit, submitLabel = "Submit", values, onChange, errors = {} }) => {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {fields.map(field => {
        if (field.type === 'select') {
          return (
            <FormSelect
              key={field.name}
              label={field.label}
              name={field.name}
              value={values[field.name] || ''}
              onChange={onChange}
              options={field.options}
              required={field.required}
              error={errors[field.name]}
            />
          );
        }
        return (
          <FormInput
            key={field.name}
            label={field.label}
            name={field.name}
            type={field.type}
            value={values[field.name] || ''}
            onChange={onChange}
            required={field.required}
            error={errors[field.name]}
          />
        );
      })}
      <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
};
