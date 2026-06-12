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

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding 500 dummy employees...');
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const designations = [
      'Developer', 'Engineer', 'Manager', 'Executive', 'Analyst', 'Specialist', 'Consultant'
    ];
    
    for (let i = 1; i <= 500; i++) {
      const name = `Dummy Employee ${i}`;
      const email = `dummy${i}_${Date.now()}@example.com`;
      const role = 'employee';
      
      const userRes = await client.query(
        'INSERT INTO users (name, email, password, role, verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, email, hashedPassword, role, true]
      );
      const userId = userRes.rows[0].id;
      
      const deptId = Math.floor(Math.random() * 8) + 1;
      const desig = designations[Math.floor(Math.random() * designations.length)];
      const phone = '9' + Math.floor(100000000 + Math.random() * 900000000);
      const salary = Math.floor(30000 + Math.random() * 120000);
      
      await client.query(
        'INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, deptId, phone, `City ${Math.floor(Math.random() * 100)}`, desig, salary]
      );
      
      if (i % 100 === 0) console.log(`Inserted ${i} employees...`);
    }

    await client.query('COMMIT');
    console.log('Successfully seeded 500 employees!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
