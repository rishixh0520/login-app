const pool = require('../../config/db');

class AttendanceRepository {
  async clockIn(employeeId, date, time) {
    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, clock_in, status) 
       VALUES ($1, $2, $3, 'Working') 
       ON CONFLICT (employee_id, date) DO NOTHING RETURNING *`,
      [employeeId, date, time]
    );
    return result.rows[0];
  }

  async clockOut(employeeId, date, time, status) {
    const result = await pool.query(
      `UPDATE attendance 
       SET clock_out = $1, status = $2 
       WHERE employee_id = $3 AND date = $4 RETURNING *`,
      [time, status, employeeId, date]
    );
    return result.rows[0];
  }

  async getAttendanceByEmployeeAndDate(employeeId, date) {
    const result = await pool.query(
      `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2`,
      [employeeId, date]
    );
    return result.rows[0];
  }

  async getAttendanceByEmployee(employeeId, startDate, endDate) {
    let query = `SELECT * FROM attendance WHERE employee_id = $1`;
    const params = [employeeId];

    if (startDate) {
      params.push(startDate);
      query += ` AND date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND date <= $${params.length}`;
    }

    query += ` ORDER BY date DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAllAttendance(search, department, startDate, endDate) {
    let query = `
      SELECT a.*, u.name, d.department_name
      FROM attendance a
      JOIN employee_profiles ep ON a.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      JOIN departments d ON ep.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND u.name ILIKE $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND d.department_name = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND a.date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND a.date <= $${params.length}`;
    }

    query += ` ORDER BY a.date DESC, u.name ASC LIMIT 500`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateAttendance(id, clockIn, clockOut, status, remarks) {
    const result = await pool.query(
      `UPDATE attendance 
       SET clock_in = $1, clock_out = $2, status = $3, remarks = $4
       WHERE id = $5 RETURNING *`,
      [clockIn, clockOut, status, remarks, id]
    );
    return result.rows[0];
  }
}

module.exports = new AttendanceRepository();
