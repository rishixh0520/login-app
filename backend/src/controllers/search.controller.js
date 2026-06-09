const pool = require('../../config/db');

class SearchController {
  async globalSearch(req, res, next) {
    try {
      const { q, limit = 10, offset = 0 } = req.query;
      
      if (!q) {
        return res.json({ data: [], total: 0 });
      }

      const searchQuery = `%${q}%`;

      const query = `
        SELECT 
          u.id, u.name, u.email, u.role, 
          d.department_name, ep.designation,
          (
            SELECT string_agg(s.skill_name, ', ')
            FROM employee_skills es
            JOIN skills s ON es.skill_id = s.id
            WHERE es.employee_id = ep.id
          ) as skills
        FROM users u
        LEFT JOIN employee_profiles ep ON u.id = ep.user_id
        LEFT JOIN departments d ON ep.department_id = d.id
        WHERE u.name ILIKE $1 
           OR u.email ILIKE $1
           OR d.department_name ILIKE $1
           OR EXISTS (
              SELECT 1 FROM employee_skills es
              JOIN skills s ON es.skill_id = s.id
              WHERE es.employee_id = ep.id AND s.skill_name ILIKE $1
           )
        ORDER BY u.name ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [searchQuery, limit, offset]);

      const countQuery = `
        SELECT COUNT(*) 
        FROM users u
        LEFT JOIN employee_profiles ep ON u.id = ep.user_id
        LEFT JOIN departments d ON ep.department_id = d.id
        WHERE u.name ILIKE $1 
           OR u.email ILIKE $1
           OR d.department_name ILIKE $1
           OR EXISTS (
              SELECT 1 FROM employee_skills es
              JOIN skills s ON es.skill_id = s.id
              WHERE es.employee_id = ep.id AND s.skill_name ILIKE $1
           )
      `;
      const countResult = await pool.query(countQuery, [searchQuery]);

      res.json({
        data: result.rows,
        total: parseInt(countResult.rows[0].count)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
