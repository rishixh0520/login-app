const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

router.get("/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    const empCount = await pool.query("SELECT COUNT(*) FROM employee_profiles");
    const depCount = await pool.query("SELECT COUNT(*) FROM departments");
    const skillCount = await pool.query("SELECT COUNT(*) FROM skills");
    const imgCount = await pool.query("SELECT COUNT(*) FROM employee_images");
    const leaveCount = await pool.query("SELECT COUNT(*) FROM leave_applications");
    const pendingCount = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status IN ('pending_manager', 'pending_hr')");
    const approvedCount = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'approved'");
    const rejectedCount = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'rejected'");
    res.json({
      employees: parseInt(empCount.rows[0].count),
      departments: parseInt(depCount.rows[0].count),
      skills: parseInt(skillCount.rows[0].count),
      images: parseInt(imgCount.rows[0].count),
      leaves: parseInt(leaveCount.rows[0].count),
      pendingApprovals: parseInt(pendingCount.rows[0].count),
      approvedLeaves: parseInt(approvedCount.rows[0].count),
      rejectedLeaves: parseInt(rejectedCount.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/reports/join1", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT u.name, d.department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN departments d ON ep.department_id = d.id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/reports/join2", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT u.name, s.skill_name
      FROM employee_skills es
      INNER JOIN employee_profiles ep ON es.employee_id = ep.id
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN skills s ON es.skill_id = s.id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
