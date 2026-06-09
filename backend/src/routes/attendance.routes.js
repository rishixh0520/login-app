const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

router.post('/clock-in', attendanceController.clockIn);
router.put('/clock-out', attendanceController.clockOut);
router.get('/mine', attendanceController.getMyAttendance);
router.get('/all', attendanceController.getAllAttendance);
router.put('/:id', attendanceController.editRecord);

module.exports = router;
