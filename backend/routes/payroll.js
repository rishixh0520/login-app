const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// Calculate Deductions Logic
function calculatePayroll(basic, hra, da, bonus) {
  const gross = basic + hra + da + bonus;
  const pf = basic * 0.12;
  const tds = gross * 0.10;
  const esi = gross <= 21000 ? gross * 0.0075 : 0;
  const net = gross - pf - tds - esi;
  return { gross, pf, tds, esi, net };
}

// 1. Get Payroll Dashboard Stats (Admin/HR)
router.get("/dashboard", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "hr") {
    return res.status(403).json({ message: "Access Denied" });
  }
  
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Total employees count
    const empCountRes = await pool.query('SELECT COUNT(*) FROM employee_profiles');
    
    // Aggregated stats for the month
    const statsRes = await pool.query(`
      SELECT 
        SUM(gross_salary) as total_payroll,
        SUM(tds) as total_tds,
        SUM(esi) as total_esi,
        SUM(pf) as total_pf,
        AVG(net_salary) as avg_salary
      FROM salaries
      WHERE salary_month = $1
    `, [month]);

    const stats = statsRes.rows[0];

    res.json({
      totalEmployees: parseInt(empCountRes.rows[0].count) || 0,
      totalPayroll: parseFloat(stats.total_payroll) || 0,
      totalTDS: parseFloat(stats.total_tds) || 0,
      totalESI: parseFloat(stats.total_esi) || 0,
      totalPF: parseFloat(stats.total_pf) || 0,
      avgSalary: parseFloat(stats.avg_salary) || 0,
      month
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error retrieving payroll dashboard" });
  }
});

// 2. Get All Salary Records (Admin/HR)
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "hr") {
    return res.status(403).json({ message: "Access Denied" });
  }

  try {
    const { month, search } = req.query;
    let query = `
      SELECT s.*, u.name, u.email, ep.designation, d.department_name
      FROM salaries s
      JOIN employee_profiles ep ON s.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE 1=1
    `;
    const values = [];

    if (month) {
      values.push(month);
      query += ` AND s.salary_month = $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      query += ` AND (u.name ILIKE $${values.length} OR CAST(ep.id AS TEXT) = $${values.length})`;
    }

    query += ` ORDER BY s.salary_month DESC, u.name ASC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching salaries" });
  }
});

// 3. Employee View Own Salary
router.get("/my-salary", auth, async (req, res) => {
  try {
    // Find employee_id for the logged-in user
    const empRes = await pool.query("SELECT id FROM employee_profiles WHERE user_id = $1", [req.user.id]);
    if (empRes.rows.length === 0) return res.status(404).json({ message: "Employee profile not found" });
    
    const empId = empRes.rows[0].id;

    const result = await pool.query(`
      SELECT s.*, u.name, u.email, ep.designation, d.department_name
      FROM salaries s
      JOIN employee_profiles ep ON s.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE s.employee_id = $1
      ORDER BY s.salary_month DESC
    `, [empId]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching your salary" });
  }
});

// 4. Create Salary Record (Admin/HR)
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "hr") {
    return res.status(403).json({ message: "Access Denied" });
  }

  try {
    const { employee_id, salary_month, basic_salary, hra, da, bonus } = req.body;

    const basic = parseFloat(basic_salary) || 0;
    const h = parseFloat(hra) || 0;
    const d = parseFloat(da) || 0;
    const b = parseFloat(bonus) || 0;

    const { gross, pf, tds, esi, net } = calculatePayroll(basic, h, d, b);

    const result = await pool.query(`
      INSERT INTO salaries (employee_id, salary_month, basic_salary, hra, da, bonus, gross_salary, tds, esi, pf, net_salary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [employee_id, salary_month, basic, h, d, b, gross, tds, esi, pf, net]);

    const empRes = await pool.query("SELECT user_id FROM employee_profiles WHERE id = $1", [employee_id]);
    if (empRes.rows.length > 0) {
      await pool.query("INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
        [empRes.rows[0].user_id, 'Salary Generated', `Your salary for ${salary_month} has been processed.`]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: "Salary record already exists for this employee and month" });
    }
    res.status(500).json({ message: "Server error creating salary record" });
  }
});

// 5. Update Salary Record (Admin/HR)
router.put("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "hr") {
    return res.status(403).json({ message: "Access Denied" });
  }

  try {
    const { basic_salary, hra, da, bonus } = req.body;
    
    const basic = parseFloat(basic_salary) || 0;
    const h = parseFloat(hra) || 0;
    const d = parseFloat(da) || 0;
    const b = parseFloat(bonus) || 0;

    const { gross, pf, tds, esi, net } = calculatePayroll(basic, h, d, b);

    const result = await pool.query(`
      UPDATE salaries 
      SET basic_salary = $1, hra = $2, da = $3, bonus = $4,
          gross_salary = $5, tds = $6, esi = $7, pf = $8, net_salary = $9
      WHERE id = $10 RETURNING *
    `, [basic, h, d, b, gross, tds, esi, pf, net, req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found" });

    const empRes = await pool.query("SELECT user_id FROM employee_profiles WHERE id = $1", [result.rows[0].employee_id]);
    if (empRes.rows.length > 0) {
      await pool.query("INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
        [empRes.rows[0].user_id, 'Salary Updated', `Your salary record has been updated by HR/Admin.`]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating salary record" });
  }
});

// 6. Delete Salary Record (Admin)
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied" });
  }

  try {
    const result = await pool.query("DELETE FROM salaries WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found" });
    
    res.json({ message: "Salary record deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting record" });
  }
});

module.exports = router;
