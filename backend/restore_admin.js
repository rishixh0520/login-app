require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'erp_db',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

async function restoreAdmin() {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash('12345678', 10);
    
    // Check if user already exists
    const res = await client.query('SELECT * FROM users WHERE email = $1', ['rishixh0520@gmail.com']);
    
    if (res.rows.length === 0) {
      const userRes = await client.query(
        'INSERT INTO users (name, email, password, role, verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Rishi Dhakad', 'rishixh0520@gmail.com', hashedPassword, 'admin', true]
      );
      
      const userId = userRes.rows[0].id;
      
      // Give Rishi an employee profile too so he doesn't break relationships that expect one
      await client.query(
        'INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 1, '9876543210', 'Indore', 'Director', 150000]
      );
      
      console.log('Restored Rishi admin account!');
    } else {
      await client.query('UPDATE users SET password = $1, role = $2 WHERE email = $3', [hashedPassword, 'admin', 'rishixh0520@gmail.com']);
      console.log('Updated Rishi admin account password!');
    }
  } catch(err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

restoreAdmin();
