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

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM users WHERE email = 'rishixh0520@gmail.com'");
    console.log("User record found?", res.rows.length > 0);
    if (res.rows.length > 0) {
      const u = res.rows[0];
      console.log("Email:", u.email);
      console.log("Role:", u.role);
      const isMatch = await bcrypt.compare('12345678', u.password);
      console.log("Password matches 12345678?", isMatch);
    } else {
      // Let's check what emails exist
      const all = await client.query("SELECT email FROM users LIMIT 10");
      console.log("Some existing emails:", all.rows);
    }
  }  catch(err){
    console.error(err); 
  } finally {
    client.release();
    pool.end();
  }
}
check();
