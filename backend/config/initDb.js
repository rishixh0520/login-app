const pool = require("./db");

async function initDb() {
  const client = await pool.connect();
  try {
    console.log("Initializing database tables...");
    await client.query("BEGIN");

    // 1. Create/alter users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user'
      );
    `);

    // Ensure role column exists (in case users table already existed without it)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);

    // 2. Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments(
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(100) UNIQUE
      );
    `);

    // Seed departments
    await client.query(`
      INSERT INTO departments(department_name)
      VALUES ('IT'), ('HR'), ('Finance'), ('Marketing')
      ON CONFLICT (department_name) DO NOTHING;
    `);

    // 3. Create employee profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_profiles(
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        department_id INT REFERENCES departments(id) ON DELETE SET NULL,
        phone VARCHAR(20),
        address TEXT,
        designation VARCHAR(100),
        salary NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create employee images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_images(
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        image_url TEXT
      );
    `);

    // 5. Create skills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills(
        id SERIAL PRIMARY KEY,
        skill_name VARCHAR(100) UNIQUE
      );
    `);

    // Seed skills
    await client.query(`
      INSERT INTO skills(skill_name)
      VALUES ('React'), ('NodeJS'), ('PostgreSQL'), ('Python'), ('Java')
      ON CONFLICT (skill_name) DO NOTHING;
    `);

    // 6. Create employee skills join table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_skills(
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE (employee_id, skill_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_types(
        id SERIAL PRIMARY KEY,
        leave_name VARCHAR(100) UNIQUE NOT NULL,
        total_days INT NOT NULL
      );
    `);

    await client.query(`
      INSERT INTO leave_types(leave_name, total_days)
      VALUES ('Casual Leave', 12), ('Sick Leave', 10), ('Earned Leave', 18), ('Maternity Leave', 90)
      ON CONFLICT (leave_name) DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_balance(
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
        available_days INT NOT NULL,
        UNIQUE (employee_id, leave_type_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_applications(
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        leave_type_id INT REFERENCES leave_types(id) ON DELETE RESTRICT,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending_manager',
        manager_remarks TEXT,
        hr_remarks TEXT,
        final_remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_history(
        id SERIAL PRIMARY KEY,
        leave_id INT REFERENCES leave_applications(id) ON DELETE CASCADE,
        approved_by INT REFERENCES users(id) ON DELETE SET NULL,
        approver_role VARCHAR(30) NOT NULL,
        action VARCHAR(50) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs(
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        action VARCHAR(100) NOT NULL,
        performed_by INT REFERENCES users(id) ON DELETE SET NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("COMMIT");
    console.log("Database initialized and seeded successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = initDb;
