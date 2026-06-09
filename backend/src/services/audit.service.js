const pool = require('../../config/db');

class AuditService {
  /**
   * Log an action to the audit trail
   * @param {string} tableName - The table being modified
   * @param {string} actionType - 'CREATE', 'UPDATE', 'DELETE'
   * @param {number} recordId - ID of the affected record
   * @param {object} oldData - JSON object of the old data (if any)
   * @param {object} newData - JSON object of the new data (if any)
   * @param {number} performedBy - User ID who performed the action
   */
  async logAction(tableName, actionType, recordId, oldData, newData, performedBy) {
    try {
      const query = `
        INSERT INTO audit_logs (table_name, action_type, record_id, old_data, new_data, performed_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const values = [
        tableName,
        actionType,
        recordId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        performedBy
      ];
      await pool.query(query, values);
    } catch (error) {
      // In a real system, you might want to log this failure but not necessarily crash the main request.
      console.error('Audit Log failed:', error);
    }
  }
}

module.exports = new AuditService();
