require('dotenv').config();
const pool = require('./config/db');

async function check() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const growthTrend = await pool.query(`
      SELECT EXTRACT(YEAR FROM join_date) as year, COUNT(id) as hires
      FROM employee_profiles
      GROUP BY year ORDER BY year
    `);

    console.log(growthTrend.rows);
    const mapped = growthTrend.rows.map(r => ({ name: r.year.toString(), value: parseInt(r.hires) }));
    console.log(mapped);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
check();
