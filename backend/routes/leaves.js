const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const allowedReviewerRoles = ["admin", "manager", "hr"];

// Keep the date calculation in one place so the workflow uses the same leave-day rule everywhere.
const calculateDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

router.get("/types", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leave_types ORDER BY leave_name ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT la.*, lt.leave_name
       FROM leave_applications la
       INNER JOIN employee_profiles ep ON ep.id = la.employee_id
       INNER JOIN leave_types lt ON lt.id = la.leave_type_id
       WHERE ep.user_id = $1
       ORDER BY la.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/all", authMiddleware, async (req, res) => {
  try {
    const isReviewer = allowedReviewerRoles.includes(req.user.role);
    if (!isReviewer) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }

    const result = await pool.query(
      `SELECT la.*, lt.leave_name, u.name AS employee_name
       FROM leave_applications la
       INNER JOIN employee_profiles ep ON ep.id = la.employee_id
       INNER JOIN users u ON u.id = ep.user_id
       INNER JOIN leave_types lt ON lt.id = la.leave_type_id
       ORDER BY la.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/apply", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { leave_type_id, from_date, to_date, reason } = req.body;
    const employeeRes = await client.query("SELECT id FROM employee_profiles WHERE user_id = $1", [req.user.id]);

    if (!employeeRes.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Employee profile not found" });
    }

    // Transaction keeps the application write isolated so later approval steps can rely on it.
    if (!leave_type_id || !from_date || !to_date || !reason?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "All fields are required" });
    }

    const total_days = calculateDays(from_date, to_date);
    if (total_days < 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid date range" });
    }

    const insertRes = await client.query(
      `INSERT INTO leave_applications(employee_id, leave_type_id, from_date, to_date, total_days, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employeeRes.rows[0].id, leave_type_id, from_date, to_date, total_days, reason.trim()]
    );

    await client.query("COMMIT");
    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

router.post("/:id/review", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { action, remarks } = req.body;
    const { id } = req.params;

    const isReviewer = allowedReviewerRoles.includes(req.user.role);
    if (!isReviewer) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    await client.query("BEGIN");

    const leaveRes = await client.query("SELECT * FROM leave_applications WHERE id = $1", [id]);
    if (leaveRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Leave application not found" });
    }

    await client.query(
      "UPDATE leave_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [action, id]
    );

    await client.query(
      "INSERT INTO approval_history(leave_id, approved_by, approver_role, action, remarks) VALUES ($1, $2, $3, $4, $5)",
      [id, req.user.id, req.user.role, action, remarks || ""]
    );

    await client.query("COMMIT");
    res.json({ message: `Leave application ${action} successfully` });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;