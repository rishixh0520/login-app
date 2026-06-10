const attendanceRepository = require('../repositories/attendance.repository');
const pool = require('../../config/db');

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class AttendanceService {
  async clockIn(userId) {
    const empResult = await pool.query('SELECT id FROM employee_profiles WHERE user_id = $1', [userId]);
    if (!empResult.rows.length) throw { statusCode: 404, message: 'Employee profile not found', isOperational: true };
    const employeeId = empResult.rows[0].id;

    const today = getLocalDateKey();
    const now = new Date();

    const existing = await attendanceRepository.getAttendanceByEmployeeAndDate(employeeId, today);
    if (existing && existing.clock_in) {
      throw { statusCode: 400, message: 'Already clocked in today', isOperational: true };
    }

    return await attendanceRepository.clockIn(employeeId, today, now);
  }

  async clockOut(userId) {
    const empResult = await pool.query('SELECT id FROM employee_profiles WHERE user_id = $1', [userId]);
    if (!empResult.rows.length) throw { statusCode: 404, message: 'Employee profile not found', isOperational: true };
    const employeeId = empResult.rows[0].id;

    const today = getLocalDateKey();
    const now = new Date();

    const existing = await attendanceRepository.getAttendanceByEmployeeAndDate(employeeId, today);
    if (!existing || !existing.clock_in) {
      throw { statusCode: 400, message: 'You have not clocked in today', isOperational: true };
    }
    if (existing.clock_out) {
      throw { statusCode: 400, message: 'Already clocked out today', isOperational: true };
    }

    const clockInTime = new Date(existing.clock_in);
    const diffHours = (now - clockInTime) / (1000 * 60 * 60);
    
    let status = 'Present';
    if (diffHours < 4) {
      status = 'Half-Day';
    }

    return await attendanceRepository.clockOut(employeeId, today, now, status);
  }

  async getMyAttendance(userId, startDate, endDate) {
    const empResult = await pool.query('SELECT id FROM employee_profiles WHERE user_id = $1', [userId]);
    if (!empResult.rows.length) return [];
    const employeeId = empResult.rows[0].id;

    // Default to current month if no dates provided
    let start = startDate;
    let end = endDate;
    if (!start || !end) {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    const records = await attendanceRepository.getAttendanceByEmployee(employeeId, start, end);
    
    // Calculate Monthly Percentage
    const totalDays = new Date(new Date(end).getFullYear(), new Date(end).getMonth() + 1, 0).getDate();
    // Count days present (excluding weekends ideally, but for now we assume 22 working days max)
    // To make it simple, we use a standard 22 days as denominator or actual records if higher
    const standardWorkingDays = 22; 
    let presentDays = 0;
    records.forEach(r => {
      if (r.status === 'Present') presentDays += 1;
      else if (r.status === 'Half-Day') presentDays += 0.5;
    });

    const percentage = Math.min(100, Math.round((presentDays / standardWorkingDays) * 100));

    return { records, percentage };
  }

  async getAllAttendance(search, department, startDate, endDate) {
    return await attendanceRepository.getAllAttendance(search, department, startDate, endDate);
  }

  async editRecord(id, adminId, data) {
    // Audit log check could be added here
    let { clock_in, clock_out, status, remarks } = data;
    
    // If setting to Absent or On Leave, clear out clock times if they are falsy
    if (status === 'Absent' || status === 'On Leave') {
      if (!clock_in) clock_in = null;
      if (!clock_out) clock_out = null;
    }

    const updated = await attendanceRepository.updateAttendance(id, clock_in || null, clock_out || null, status, remarks || '');
    if (!updated) throw { statusCode: 404, message: 'Record not found', isOperational: true };
    return updated;
  }
}

module.exports = new AttendanceService();
