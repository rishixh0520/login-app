const pool = require('../../config/db');

class AssetsRepository {
  async getAllAssets(limit = 10, offset = 0, status = null) {
    let query = 'SELECT * FROM assets';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    const countResult = await pool.query('SELECT COUNT(*) FROM assets' + (status ? ' WHERE status = $1' : ''), status ? [status] : []);
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  async getAssetById(id) {
    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    return result.rows[0];
  }

  async createAsset(asset) {
    const { asset_code, asset_name, asset_type, purchase_date, purchase_cost, status } = asset;
    const result = await pool.query(
      `INSERT INTO assets (asset_code, asset_name, asset_type, purchase_date, purchase_cost, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [asset_code, asset_name, asset_type, purchase_date, purchase_cost, status || 'Available']
    );
    return result.rows[0];
  }

  async updateAssetStatus(id, status) {
    const result = await pool.query(
      'UPDATE assets SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  async allocateAsset(assetId, employeeId, allocatedBy, allocatedDate) {
    const result = await pool.query(
      `INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_date, status) 
       VALUES ($1, $2, $3, $4, 'Allocated') RETURNING *`,
      [assetId, employeeId, allocatedBy, allocatedDate]
    );
    return result.rows[0];
  }

  async returnAsset(allocationId, returnDate) {
    const result = await pool.query(
      `UPDATE asset_allocations SET return_date = $1, status = 'Returned' WHERE id = $2 RETURNING *`,
      [returnDate, allocationId]
    );
    return result.rows[0];
  }

  async addHistory(assetId, action, remarks, createdBy) {
    await pool.query(
      `INSERT INTO asset_history (asset_id, action, remarks, created_by) VALUES ($1, $2, $3, $4)`,
      [assetId, action, remarks, createdBy]
    );
  }

  async getAssetHistory(assetId) {
    const result = await pool.query(
      `SELECT ah.*, u.name as created_by_name 
       FROM asset_history ah 
       LEFT JOIN users u ON ah.created_by = u.id 
       WHERE asset_id = $1 ORDER BY created_at DESC`,
      [assetId]
    );
    return result.rows;
  }
  
  async getActiveAllocation(assetId) {
     const result = await pool.query(
       `SELECT * FROM asset_allocations WHERE asset_id = $1 AND status = 'Allocated'`, [assetId]
     );
     return result.rows[0];
  }
}

module.exports = new AssetsRepository();
