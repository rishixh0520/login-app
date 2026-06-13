const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const authMiddleware = require('../../middleware/auth');

// ---------------------------------------------------------
// EXECUTIVE DASHBOARD ANALYTICS
// ---------------------------------------------------------
router.get('/executive', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // 1. Core KPIs
    const kpiRes = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        AVG(salary) as average_salary,
        SUM(salary) as total_monthly_payroll,
        SUM(salary * 0.1) as total_tds, -- Estimating based on salary if actuals aren't strictly joined for performance
        SUM(salary * 0.12) as total_pf,
        SUM(CASE WHEN salary <= 21000 THEN salary * 0.0075 ELSE 0 END) as total_esi,
        COUNT(CASE WHEN EXTRACT(MONTH FROM join_date) = $1 AND EXTRACT(YEAR FROM join_date) = $2 THEN 1 END) as new_hires_this_month,
        COUNT(CASE WHEN exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = $2 THEN 1 END) as exits_this_year
      FROM employee_profiles
      WHERE exit_date IS NULL OR exit_date > $3
    `, [currentMonth, currentYear, today]);

    const kpis = kpiRes.rows[0];

    const leavesRes = await pool.query(`
      SELECT COUNT(DISTINCT employee_id) as employees_on_leave
      FROM leave_applications
      WHERE status = 'approved' AND $1 BETWEEN from_date AND to_date
    `, [today]);

    const attendanceRes = await pool.query(`
      SELECT COUNT(DISTINCT employee_id) as present_today
      FROM attendance WHERE date = $1 AND status NOT IN ('Absent', 'On Leave')
    `, [today]);

    const activeEmployees = parseInt(kpis.total_employees) || 1;
    const presentToday = parseInt(attendanceRes.rows[0].present_today) || 0;
    const attendanceRate = Math.round((presentToday / activeEmployees) * 100);

    const exitsThisYear = parseInt(kpis.exits_this_year) || 0;
    const attritionRate = Math.round((exitsThisYear / activeEmployees) * 100);
    const retentionRate = 100 - attritionRate;

    // 2. Department Distribution
    const deptDist = await pool.query(`
      SELECT d.department_name as name, COUNT(e.id) as value
      FROM employee_profiles e
      JOIN departments d ON e.department_id = d.id
      WHERE e.exit_date IS NULL OR e.exit_date > $1
      GROUP BY d.department_name
    `, [today]);

    // 3. Employee Growth Trend (Simplified by joining Year)
    const growthTrend = await pool.query(`
      SELECT EXTRACT(YEAR FROM join_date) as year, COUNT(id) as hires
      FROM employee_profiles
      GROUP BY year ORDER BY year
    `);

    // 4. Leave Status Analysis
    const leaveStatus = await pool.query(`
      SELECT status as name, COUNT(id) as value
      FROM leave_applications
      GROUP BY status
    `);

    // 5. Department Salary Comparison
    const deptSalary = await pool.query(`
      SELECT d.department_name as name, AVG(e.salary) as value
      FROM employee_profiles e
      JOIN departments d ON e.department_id = d.id
      WHERE e.exit_date IS NULL OR e.exit_date > $1
      GROUP BY d.department_name
    `, [today]);

    // 6. Performance Distribution
    const perfDist = await pool.query(`
      SELECT performance_rating || ' Stars' as name, COUNT(id) as value
      FROM employee_profiles
      WHERE performance_rating IS NOT NULL AND (exit_date IS NULL OR exit_date > $1)
      GROUP BY performance_rating
      ORDER BY performance_rating
    `, [today]);

    // 7. Gender Diversity
    const genderDist = await pool.query(`
      SELECT COALESCE(gender, 'Unspecified') as name, COUNT(id) as value
      FROM employee_profiles
      WHERE exit_date IS NULL OR exit_date > $1
      GROUP BY gender
    `, [today]);

    // 8. Experience Distribution
    const expDist = await pool.query(`
      SELECT 
        CASE 
          WHEN (CURRENT_DATE - join_date)/365 < 1 THEN '0-1 Years'
          WHEN (CURRENT_DATE - join_date)/365 < 3 THEN '1-3 Years'
          WHEN (CURRENT_DATE - join_date)/365 < 5 THEN '3-5 Years'
          ELSE '5+ Years'
        END as name,
        COUNT(id) as value
      FROM employee_profiles
      WHERE exit_date IS NULL OR exit_date > $1
      GROUP BY name
    `, [today]);

    // 9. Payroll Cost Trend (From salaries table)
    const payrollTrend = await pool.query(`
      SELECT salary_month as month, SUM(gross_salary) as total_payroll
      FROM salaries
      GROUP BY salary_month
      ORDER BY salary_month DESC
      LIMIT 6
    `);

    // Format payroll trend to ensure last 6 months always exist
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      last6Months.push({ name: `${yyyy}-${mm}`, value: 0 });
    }

    payrollTrend.rows.forEach(r => {
      const match = last6Months.find(m => m.name === r.month);
      if (match) {
        match.value = parseFloat(r.total_payroll) || 0;
      }
    });

    res.json({
      kpis: {
        totalEmployees: activeEmployees,
        newHiresThisMonth: parseInt(kpis.new_hires_this_month),
        employeesOnLeave: parseInt(leavesRes.rows[0].employees_on_leave),
        totalMonthlyPayroll: parseFloat(kpis.total_monthly_payroll) || 0,
        totalTDS: parseFloat(kpis.total_tds) || 0,
        totalPF: parseFloat(kpis.total_pf) || 0,
        totalESI: parseFloat(kpis.total_esi) || 0,
        averageSalary: parseFloat(kpis.average_salary) || 0,
        attritionRate,
        retentionRate,
        attendanceRate
      },
      charts: {
        departmentDistribution: deptDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        employeeGrowthTrend: growthTrend.rows.map(r => ({ name: (r.year || 'Unknown').toString(), value: parseInt(r.hires) })),
        leaveStatusAnalysis: leaveStatus.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        departmentSalaryComparison: deptSalary.rows.map(r => ({ name: r.name, value: parseFloat(r.value) })),
        performanceDistribution: perfDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        genderDiversity: genderDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        experienceDistribution: expDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        payrollCostTrend: last6Months
      }
    });

  } catch (error) {
    console.error("Executive Analytics Error:", error);
    res.status(500).json({ message: "Internal server error generating analytics" });
  }
});


// ---------------------------------------------------------
// DEPARTMENT DASHBOARD ANALYTICS
// ---------------------------------------------------------
router.get('/department/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const kpiRes = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        AVG(salary) as average_salary,
        SUM(salary) as department_payroll
      FROM employee_profiles
      WHERE department_id = $1 AND (exit_date IS NULL OR exit_date > $2)
    `, [id, today]);

    const kpis = kpiRes.rows[0];

    const leaveRes = await pool.query(`
      SELECT COUNT(*) as open_leaves
      FROM leave_applications la
      JOIN employee_profiles ep ON la.employee_id = ep.id
      WHERE ep.department_id = $1 AND la.status IN ('pending_manager', 'pending_hr')
    `, [id]);

    const attendanceRes = await pool.query(`
      SELECT COUNT(DISTINCT a.employee_id) as present_today
      FROM attendance a
      JOIN employee_profiles ep ON a.employee_id = ep.id
      WHERE ep.department_id = $1 AND a.date = $2 AND a.status NOT IN ('Absent', 'On Leave')
    `, [id, today]);

    const activeEmployees = parseInt(kpis.total_employees) || 1;
    const presentToday = parseInt(attendanceRes.rows[0].present_today) || 0;
    const attendanceRate = Math.round((presentToday / activeEmployees) * 100);

    // Charts
    const desigDist = await pool.query(`
      SELECT designation as name, COUNT(id) as value
      FROM employee_profiles
      WHERE department_id = $1 AND (exit_date IS NULL OR exit_date > $2)
      GROUP BY designation
    `, [id, today]);

    const perfDist = await pool.query(`
      SELECT performance_rating || ' Stars' as name, COUNT(id) as value
      FROM employee_profiles
      WHERE department_id = $1 AND performance_rating IS NOT NULL AND (exit_date IS NULL OR exit_date > $2)
      GROUP BY performance_rating
      ORDER BY performance_rating
    `, [id, today]);

    const genderDist = await pool.query(`
      SELECT COALESCE(gender, 'Unspecified') as name, COUNT(id) as value
      FROM employee_profiles
      WHERE department_id = $1 AND (exit_date IS NULL OR exit_date > $2)
      GROUP BY gender
    `, [id, today]);

    res.json({
      kpis: {
        totalEmployees: activeEmployees,
        departmentPayroll: parseFloat(kpis.department_payroll) || 0,
        averageSalary: parseFloat(kpis.average_salary) || 0,
        openLeaveRequests: parseInt(leaveRes.rows[0].open_leaves),
        attendanceRate
      },
      charts: {
        designationDistribution: desigDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        performanceDistribution: perfDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        genderDiversity: genderDist.rows.map(r => ({ name: r.name, value: parseInt(r.value) }))
      }
    });

  } catch (error) {
    console.error("Department Analytics Error:", error);
    res.status(500).json({ message: "Internal server error generating department analytics" });
  }
});


// ---------------------------------------------------------
// MANAGER INSIGHTS
// ---------------------------------------------------------
router.get('/manager-insights', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const highestPaid = await pool.query(`
      SELECT u.name, d.department_name as department, ep.designation, ep.salary
      FROM employee_profiles ep
      JOIN users u ON ep.user_id = u.id
      JOIN departments d ON ep.department_id = d.id
      WHERE ep.exit_date IS NULL OR ep.exit_date > $1
      ORDER BY ep.salary DESC
      LIMIT 10
    `, [today]);

    const topPerformers = await pool.query(`
      SELECT u.name, d.department_name as department, ep.designation, ep.performance_rating
      FROM employee_profiles ep
      JOIN users u ON ep.user_id = u.id
      JOIN departments d ON ep.department_id = d.id
      WHERE ep.performance_rating = 5 AND (ep.exit_date IS NULL OR ep.exit_date > $1)
      ORDER BY RANDOM()
      LIMIT 10
    `, [today]);

    const recentJoiners = await pool.query(`
      SELECT u.name, d.department_name as department, ep.designation, ep.join_date
      FROM employee_profiles ep
      JOIN users u ON ep.user_id = u.id
      JOIN departments d ON ep.department_id = d.id
      WHERE ep.exit_date IS NULL OR ep.exit_date > $1
      ORDER BY ep.join_date DESC
      LIMIT 10
    `, [today]);

    const mostLeaves = await pool.query(`
      SELECT u.name, d.department_name as department, COUNT(la.id) as total_leaves
      FROM leave_applications la
      JOIN employee_profiles ep ON la.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      JOIN departments d ON ep.department_id = d.id
      WHERE la.status = 'approved'
      GROUP BY u.name, d.department_name
      ORDER BY total_leaves DESC
      LIMIT 10
    `);

    res.json({
      highestPaid: highestPaid.rows,
      topPerformers: topPerformers.rows,
      recentJoiners: recentJoiners.rows,
      mostLeaves: mostLeaves.rows
    });

  } catch (error) {
    console.error("Manager Insights Error:", error);
    res.status(500).json({ message: "Internal server error generating manager insights" });
  }
});

module.exports = router;
