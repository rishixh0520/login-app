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

const firstNames = [
  'Rahul', 'Priya', 'Amit', 'Neha', 'Arjun', 'Sneha', 'Aditya', 'Pooja',
  'Rohit', 'Anjali', 'Vikas', 'Kavita', 'Suresh', 'Divya', 'Ramesh', 'Swati',
  'Karan', 'Megha', 'Sanjay', 'Riya', 'Mohit', 'Tanvi', 'Abhishek', 'Shruti',
  'Nitin', 'Nidhi', 'Gaurav', 'Aarti', 'Manish', 'Kritika'
];
const lastNames = [
  'Sharma', 'Verma', 'Singh', 'Gupta', 'Patel', 'Joshi', 'Mishra', 'Yadav',
  'Kumar', 'Mehta', 'Shah', 'Chauhan', 'Agarwal', 'Reddy', 'Nair', 'Das',
  'Bose', 'Rao', 'Iyer', 'Deshmukh', 'Tiwari', 'Pandey', 'Dubey', 'Chatterjee'
];

const departmentsList = ['HR', 'IT', 'Finance', 'Marketing', 'Operations', 'Sales'];

const rolesConfig = [
  { title: 'Intern', range: [15000, 25000] },
  { title: 'HR Executive', range: [25000, 50000] },
  { title: 'Accountant', range: [25000, 50000] },
  { title: 'Marketing Executive', range: [25000, 50000] },
  { title: 'Admin', range: [25000, 50000] },
  { title: 'Software Engineer', range: [40000, 80000] },
  { title: 'Senior Software Engineer', range: [60000, 100000] },
  { title: 'Team Lead', range: [80000, 120000] },
  { title: 'Manager', range: [100000, 200000] }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Wiping existing database and recreating schema...');
    
    await client.query(`
      ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS performance_rating INT;
      ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS join_date DATE;
      ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS exit_date DATE;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS salaries (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        salary_month VARCHAR(20) NOT NULL,
        basic_salary NUMERIC(10,2) NOT NULL,
        hra NUMERIC(10,2) NOT NULL,
        da NUMERIC(10,2) NOT NULL,
        bonus NUMERIC(10,2) DEFAULT 0,
        gross_salary NUMERIC(10,2) NOT NULL,
        tds NUMERIC(10,2) NOT NULL,
        esi NUMERIC(10,2) NOT NULL,
        pf NUMERIC(10,2) NOT NULL,
        net_salary NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (employee_id, salary_month)
      );
    `);

    await client.query("TRUNCATE TABLE salaries, password_reset, refresh_tokens, audit_logs, notifications, asset_history, asset_allocations, assets, attendance, approval_history, leave_applications, leave_balance, leave_types, employee_skills, skills, employee_profiles, departments, users RESTART IDENTITY CASCADE");

    console.log('Seeding departments...');
    for (const d of departmentsList) {
      await client.query('INSERT INTO departments (department_name) VALUES ($1)', [d]);
    }

    console.log('Seeding leave types...');
    await client.query("INSERT INTO leave_types(leave_name, total_days) VALUES ('Casual Leave', 12), ('Sick Leave', 10), ('Earned Leave', 18)");

    const hashedPassword = await bcrypt.hash('password123', 10);
    const rishiPassword = await bcrypt.hash('12345678', 10);
    
    // Add 1 Admin manually so you can still log in easily
    const adminRes = await client.query(
      'INSERT INTO users (name, email, password, role, verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Rishi', 'rishixh0520@gmail.com', rishiPassword, 'admin', true]
    );
    const adminId = adminRes.rows[0].id;

    // Add profile for admin
    const adminEmpRes = await client.query(
      'INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary, gender, performance_rating, join_date, exit_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [adminId, 2, '9876543210', 'India', 'Chief Executive Officer', 250000, 'Male', 5, '2020-01-01', null]
    );
    const adminEmpId = adminEmpRes.rows[0].id;

    await client.query("INSERT INTO leave_balance (employee_id, leave_type_id, available_days) VALUES ($1, 1, 12), ($1, 2, 10), ($1, 3, 18)", [adminEmpId]);

    // Add salary for admin
    for (const month of ['2026-04', '2026-05', '2026-06']) {
      await client.query(
        `INSERT INTO salaries (employee_id, salary_month, basic_salary, hra, da, bonus, gross_salary, tds, esi, pf, net_salary) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [adminEmpId, month, 100000, 50000, 75000, 25000, 250000, 25000, 0, 12000, 213000]
      );
    }

    console.log('Generating 500 realistic employees...');
    
    await client.query('BEGIN');

    for (let i = 1; i <= 500; i++) {
      const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const email = `${name.toLowerCase().replace(' ', '.')}${i}@example.com`;
      const role = 'employee';

      const userRes = await client.query(
        'INSERT INTO users (name, email, password, role, verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, email, hashedPassword, role, true]
      );
      const userId = userRes.rows[0].id;
      
      const deptId = getRandomInt(1, departmentsList.length);
      const desigConfig = getRandomItem(rolesConfig);
      const desig = desigConfig.title;
      const targetGross = getRandomInt(desigConfig.range[0], desigConfig.range[1]);
      
      const phone = '9' + Math.floor(100000000 + Math.random() * 900000000);
      const gender = Math.random() > 0.4 ? 'Male' : 'Female'; // 60/40 split
      
      // Performance rating normal distribution (mostly 3 and 4, some 5, some 1/2)
      const rand = Math.random();
      let perf = 3;
      if (rand > 0.9) perf = 5;
      else if (rand > 0.5) perf = 4;
      else if (rand > 0.1) perf = 3;
      else perf = 2;

      // Join date within last 5 years
      const today = new Date();
      const pastDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      const joinDate = new Date(pastDate.getTime() + Math.random() * (today.getTime() - pastDate.getTime()));
      
      // 10% attrition rate
      let exitDate = null;
      if (Math.random() > 0.9) {
          exitDate = new Date(joinDate.getTime() + Math.random() * (today.getTime() - joinDate.getTime()));
      }

      const empRes = await client.query(
        'INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary, gender, performance_rating, join_date, exit_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
        [userId, deptId, phone, 'India', desig, targetGross, gender, perf, joinDate.toISOString().split('T')[0], exitDate ? exitDate.toISOString().split('T')[0] : null]
      );
      const empId = empRes.rows[0].id;

      // Seed Leave Balances
      await client.query("INSERT INTO leave_balance (employee_id, leave_type_id, available_days) VALUES ($1, 1, 12), ($1, 2, 10), ($1, 3, 18)", [empId]);

      // Seed Leave History randomly (1-2 records)
      if (Math.random() > 0.5) {
        await client.query(
          "INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status) VALUES ($1, 1, '2026-06-10', '2026-06-11', 2, 'Personal', $2)",
          [empId, getRandomItem(['approved', 'rejected', 'pending_manager'])]
        );
      }

      // Seed Salaries
      const basic = targetGross * 0.4;
      const hra = targetGross * 0.2;
      const da = targetGross * 0.3;
      const bonus = targetGross * 0.1;

      const pf = basic * 0.12;
      const esi = targetGross <= 21000 ? targetGross * 0.0075 : 0;
      const tds = targetGross * 0.1;
      const net = targetGross - pf - esi - tds;

      // Add a couple of months of salary
      for (const month of ['2026-04', '2026-05', '2026-06']) {
        await client.query(
          `INSERT INTO salaries (employee_id, salary_month, basic_salary, hra, da, bonus, gross_salary, tds, esi, pf, net_salary) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [empId, month, basic, hra, da, bonus, targetGross, tds, esi, pf, net]
        );
      }

      if (i % 100 === 0) console.log(`Inserted ${i} employees...`);
    }

    await client.query('COMMIT');
    console.log('Successfully seeded 500 realistic records and salary data!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
