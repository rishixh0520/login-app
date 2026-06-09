const pool = require('../../config/db');

class ReportsRepository {
  async getEmployeeReportData() {
    const query = `
      SELECT u.name, u.email, d.department_name, ep.designation, ep.salary, ep.phone
      FROM users u
      JOIN employee_profiles ep ON u.id = ep.user_id
      JOIN departments d ON ep.department_id = d.id
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getAssetReportData() {
    const query = `
      SELECT a.asset_code, a.asset_name, a.asset_type, a.status, u.name as allocated_to
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'Allocated'
      LEFT JOIN employee_profiles ep ON aa.employee_id = ep.id
      LEFT JOIN users u ON ep.user_id = u.id
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getLeaveReportData() {
    const query = `
      SELECT u.name, lt.leave_name, la.from_date, la.to_date, la.total_days, la.status
      FROM leave_applications la
      JOIN employee_profiles ep ON la.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new ReportsRepository();
