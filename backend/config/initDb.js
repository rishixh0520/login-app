const bcrypt = require("bcrypt");
const pool = require("./db");

async function bulkInsert(client, table, columns, rows) {
  if (!rows.length) return;

  const values = [];
  const placeholders = rows
    .map((row) => {
      const rowPlaceholders = row.map((value) => {
        values.push(value);
        return `$${values.length}`;
      });
      return `(${rowPlaceholders.join(", ")})`;
    })
    .join(", ");

  await client.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`,
    values
  );
}

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
        role VARCHAR(20) DEFAULT 'user',
        verified BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS password_reset (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        token TEXT,
        expires_at TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        token TEXT
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
        table_name VARCHAR(100),
        action_type VARCHAR(50),
        record_id INT,
        old_data JSONB,
        new_data JSONB,
        performed_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Day 5 Advanced Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        asset_code VARCHAR(50),
        asset_name VARCHAR(200),
        asset_type VARCHAR(100),
        purchase_date DATE,
        purchase_cost NUMERIC(12,2),
        status VARCHAR(50) DEFAULT 'Available'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_allocations (
        id SERIAL PRIMARY KEY,
        asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        allocated_by INT REFERENCES users(id) ON DELETE SET NULL,
        allocated_date DATE,
        return_date DATE,
        status VARCHAR(50) DEFAULT 'Allocated'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_history (
        id SERIAL PRIMARY KEY,
        asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
        action VARCHAR(100),
        remarks TEXT,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        clock_in TIMESTAMP,
        clock_out TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Present',
        remarks TEXT,
        UNIQUE(employee_id, date)
      );
    `);

    // Create View: employee_summary
    await client.query(`
      CREATE OR REPLACE VIEW employee_summary AS
      SELECT
        u.name,
        d.department_name,
        ep.designation,
        ep.salary,
        u.email
      FROM users u
      JOIN employee_profiles ep ON u.id = ep.user_id
      JOIN departments d ON d.id = ep.department_id;
    `);

    // Create Stored Procedure / Function: calculate_leave_balance
    // Example logic: just returns balance for now, can be expanded
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_leave_balance(emp_id INT, l_type_id INT)
      RETURNS INT AS $$
      DECLARE
        balance INT;
      BEGIN
        SELECT available_days INTO balance 
        FROM leave_balance 
        WHERE employee_id = emp_id AND leave_type_id = l_type_id;
        
        IF balance IS NULL THEN
          RETURN 0;
        END IF;
        
        RETURN balance;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Reset the demo tables so the provided company dataset stays deterministic on every restart.
    await client.query(`
      TRUNCATE TABLE
        attendance,
        asset_history,
        asset_allocations,
        assets,
        notifications,
        approval_history,
        leave_applications,
        leave_balance,
        employee_skills,
        employee_profiles,
        leave_types,
        skills,
        departments,
        users,
        audit_logs
      RESTART IDENTITY CASCADE;
    `);

    const demoPasswordHash = await bcrypt.hash("123456", 10);
    await client.query("TRUNCATE TABLE password_reset, refresh_tokens, audit_logs, notifications, asset_history, asset_allocations, assets, attendance, approval_history, leave_applications, leave_balance, leave_types, employee_skills, skills, employee_profiles, departments, users RESTART IDENTITY CASCADE");

    console.log("Seeding data...");

    // 1. Departments
    const departments = [
      ["Software Development"],
      ["Quality Assurance"],
      ["Human Resources"],
      ["Finance"],
      ["Digital Marketing"],
      ["Sales"],
      ["Operations"],
      ["Technical Support"],
    ];
    await bulkInsert(client, "departments", ["department_name"], departments);

    // 2. Users (Adding verified = true for seeded users)
    const users = [
      ["Pranay Gupta", "pranay@isoftzone.com", await bcrypt.hash("123456", 10), "admin", true],
      ["Rahul Sharma", "rahul@isoftzone.com", await bcrypt.hash("123456", 10), "manager", true],
      ["Priya Verma", "priya@isoftzone.com", await bcrypt.hash("123456", 10), "hr", true],
      ["Amit Patel", "amit@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
      ["Neha Jain", "neha@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
      ["Rohit Singh", "rohit@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
      ["Anjali Gupta", "anjali@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
      ["Vikas Mehta", "vikas@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
      ["Pooja Shah", "pooja@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
      ["Sandeep Kumar", "sandeep@isoftzone.com", await bcrypt.hash("123456", 10), "employee", true],
    ];
    await bulkInsert(client, "users", ["name", "email", "password", "role", "verified"], users);

    await bulkInsert(
      client,
      "employee_profiles",
      ["user_id", "department_id", "phone", "address", "designation", "salary"],
      [
        [1, 1, "9876543210", "Indore", "Director", 150000],
        [2, 1, "9876543211", "Indore", "Project Manager", 85000],
        [3, 3, "9876543212", "Indore", "HR Manager", 70000],
        [4, 1, "9876543213", "Indore", "React Developer", 45000],
        [5, 1, "9876543214", "Indore", "Node Developer", 50000],
        [6, 2, "9876543215", "Indore", "QA Engineer", 40000],
        [7, 5, "9876543216", "Indore", "Marketing Executive", 35000],
        [8, 6, "9876543217", "Indore", "Sales Executive", 38000],
        [9, 8, "9876543218", "Indore", "Support Engineer", 32000],
        [10, 4, "9876543219", "Indore", "Accountant", 42000],
      ]
    );

    await bulkInsert(
      client,
      "skills",
      ["skill_name"],
      [
        ["React"],
        ["NodeJS"],
        ["PostgreSQL"],
        ["JavaScript"],
        ["HTML"],
        ["CSS"],
        ["MongoDB"],
        ["Python"],
        ["Testing"],
        ["Salesforce"],
      ]
    );

    await bulkInsert(
      client,
      "employee_skills",
      ["employee_id", "skill_id"],
      [
        [4, 1],
        [4, 4],
        [4, 5],
        [5, 2],
        [5, 3],
        [5, 4],
        [6, 9],
        [7, 4],
        [8, 10],
        [9, 2],
        [9, 3],
        [10, 8],
      ]
    );

    await bulkInsert(
      client,
      "leave_types",
      ["leave_name", "total_days"],
      [
        ["Casual Leave", 12],
        ["Sick Leave", 10],
        ["Earned Leave", 15],
        ["Maternity Leave", 90],
      ]
    );

    await bulkInsert(
      client,
      "leave_balance",
      ["employee_id", "leave_type_id", "available_days"],
      [
        [4, 1, 10],
        [4, 2, 8],
        [5, 1, 12],
        [5, 2, 10],
        [6, 1, 8],
        [6, 2, 6],
        [7, 1, 10],
        [7, 2, 7],
        [8, 1, 12],
        [8, 2, 10],
      ]
    );

    await bulkInsert(
      client,
      "leave_applications",
      ["employee_id", "leave_type_id", "from_date", "to_date", "total_days", "reason", "status"],
      [
        [4, 1, "2026-06-01", "2026-06-03", 3, "Family Function", "approved"],
        [5, 2, "2026-06-10", "2026-06-11", 2, "Fever", "pending_manager"],
        [6, 1, "2026-05-20", "2026-05-21", 2, "Personal Work", "approved"],
        [7, 1, "2026-06-15", "2026-06-17", 3, "Travel", "pending_manager"],
        [8, 2, "2026-06-18", "2026-06-20", 3, "Medical", "rejected"],
      ]
    );

    await bulkInsert(
      client,
      "approval_history",
      ["leave_id", "approved_by", "approver_role", "action", "remarks"],
      [
        [1, 2, "manager", "approved", "Manager Approved"],
        [1, 3, "hr", "approved", "HR Approved"],
        [3, 2, "manager", "approved", "Manager Approved"],
        [3, 3, "hr", "approved", "HR Approved"],
        [5, 2, "manager", "rejected", "Insufficient Reason"],
      ]
    );

    await bulkInsert(
      client,
      "assets",
      ["asset_code", "asset_name", "asset_type", "purchase_date", "purchase_cost", "status"],
      [
        ["LPT-001", "MacBook Pro M2", "Laptop", "2026-01-10", 1500.00, "Allocated"],
        ["LPT-002", "Dell XPS 15", "Laptop", "2026-02-15", 1200.00, "Available"],
        ["MNT-001", "LG 27 inch 4K", "Monitor", "2026-03-01", 300.00, "Allocated"],
        ["MOU-001", "Logitech MX Master 3", "Mouse", "2026-03-05", 100.00, "Available"]
      ]
    );

    await bulkInsert(
      client,
      "asset_allocations",
      ["asset_id", "employee_id", "allocated_by", "allocated_date", "status"],
      [
        [1, 4, 2, "2026-04-01", "Allocated"],
        [3, 4, 2, "2026-04-01", "Allocated"]
      ]
    );

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
