import React from 'react';
import { Edit, Trash } from 'lucide-react';

export default function FormTable({ columns, data, onEdit, onDelete }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col, i) => <th key={i}>{col.header}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{row[col.accessor]}</td>
              ))}
              <td>
                <div className="action-buttons">
                  {onEdit && <button className="btn-icon" onClick={() => onEdit(row)}><Edit size={16} /></button>}
                  {onDelete && <button className="btn-icon delete" onClick={() => onDelete(row)}><Trash size={16} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
