const attendanceService = require('../services/attendance.service');

class AttendanceController {
  async clockIn(req, res, next) {
    try {
      const result = await attendanceService.clockIn(req.user.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async clockOut(req, res, next) {
    try {
      const result = await attendanceService.clockOut(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMyAttendance(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const result = await attendanceService.getMyAttendance(req.user.id, startDate, endDate);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllAttendance(req, res, next) {
    try {
      const { search, department, startDate, endDate } = req.query;
      const result = await attendanceService.getAllAttendance(search, department, startDate, endDate);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async editRecord(req, res, next) {
    try {
      if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const result = await attendanceService.editRecord(req.params.id, req.user.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
