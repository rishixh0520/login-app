const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../backend/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"), false);
  }
});

router.post("/upload", authMiddleware, upload.array("images", 5), (req, res) => {
  try {
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT ep.*, u.name as employee_name, u.email as employee_email, d.department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      LEFT JOIN departments d ON ep.department_id = d.id
      ORDER BY ep.created_at DESC
    `;
    const employees = (await pool.query(query)).rows;

    if (employees.length > 0) {
      const employeeIds = employees.map(emp => emp.id);

      // Fetch all skills and images in just 2 parallel queries using ANY()
      const [skillsRes, imagesRes] = await Promise.all([
        pool.query(`
          SELECT es.employee_id, s.id, s.skill_name 
          FROM employee_skills es 
          INNER JOIN skills s ON es.skill_id = s.id 
          WHERE es.employee_id = ANY($1::int[])
        `, [employeeIds]),
        pool.query(`
          SELECT employee_id, id, image_url 
          FROM employee_images 
          WHERE employee_id = ANY($1::int[])
        `, [employeeIds])
      ]);

      // Group by employee_id for quick lookup
      const skillsMap = {};
      skillsRes.rows.forEach(row => {
        if (!skillsMap[row.employee_id]) skillsMap[row.employee_id] = [];
        skillsMap[row.employee_id].push({ id: row.id, skill_name: row.skill_name });
      });

      const imagesMap = {};
      imagesRes.rows.forEach(row => {
        if (!imagesMap[row.employee_id]) imagesMap[row.employee_id] = [];
        imagesMap[row.employee_id].push({ id: row.id, image_url: row.image_url });
      });

      // Attach to employees
      for (let emp of employees) {
        emp.skills = skillsMap[emp.id] || [];
        emp.images = imagesMap[emp.id] || [];
      }
    }

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users/available", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email FROM users 
      WHERE id NOT IN (SELECT user_id FROM employee_profiles WHERE user_id IS NOT NULL)
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT ep.*, u.name as employee_name, u.email as employee_email, d.department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE ep.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const emp = result.rows[0];
    const skillsRes = await pool.query(
      `SELECT s.id, s.skill_name FROM employee_skills es INNER JOIN skills s ON es.skill_id = s.id WHERE es.employee_id = $1`,
      [id]
    );
    const imagesRes = await pool.query(
      `SELECT id, image_url FROM employee_images WHERE employee_id = $1`,
      [id]
    );
    emp.skills = skillsRes.rows;
    emp.images = imagesRes.rows;
    res.json(emp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { user_id, department_id, phone, address, designation, salary, skills, images } = req.body;
    const profileRes = await client.query(
      `INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, department_id, phone, address, designation, salary]
    );
    const employee_id = profileRes.rows[0].id;

    if (skills?.length) {
      for (const s of skills) await client.query(`INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)`, [employee_id, s]);
    }
    if (images?.length) {
      for (const i of images) await client.query(`INSERT INTO employee_images (employee_id, image_url) VALUES ($1, $2)`, [employee_id, i]);
    }
    await client.query("COMMIT");
    res.status(201).json(profileRes.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { department_id, phone, address, designation, salary, skills, images } = req.body;
    await client.query(
      `UPDATE employee_profiles SET department_id = $1, phone = $2, address = $3, designation = $4, salary = $5 WHERE id = $6`,
      [department_id, phone, address, designation, salary, id]
    );
    await client.query("DELETE FROM employee_skills WHERE employee_id = $1", [id]);
    if (skills?.length) {
      for (const s of skills) await client.query(`INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)`, [id, s]);
    }
    await client.query("DELETE FROM employee_images WHERE employee_id = $1", [id]);
    if (images?.length) {
      for (const i of images) await client.query(`INSERT INTO employee_images (employee_id, image_url) VALUES ($1, $2)`, [id, i]);
    }
    await client.query("COMMIT");
    res.json({ message: "Updated" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM employee_profiles WHERE id = $1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/performance", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Only admins can update performance ratings." });
  }

  const { id } = req.params;
  const { performance_rating, performance_remark } = req.body;

  try {
    const result = await pool.query(
      `UPDATE employee_profiles 
       SET performance_rating = $1, performance_remark = $2 
       WHERE id = $3 RETURNING *`,
      [performance_rating || null, performance_remark || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Performance updated successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
