const assetsRepository = require('../repositories/assets.repository');
const auditService = require('./audit.service');
const notificationsService = require('./notifications.service');
const pool = require('../../config/db');

class AssetsService {
  async getAllAssets(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    return await assetsRepository.getAllAssets(limit, offset, status);
  }

  async createAsset(assetData, userId) {
    const asset = await assetsRepository.createAsset(assetData);
    
    // Audit log
    await auditService.logAction('assets', 'CREATE', asset.id, null, asset, userId);
    
    // History log
    await assetsRepository.addHistory(asset.id, 'Asset Created', `Asset ${asset.asset_code} added to inventory.`, userId);
    
    return asset;
  }

  async allocateAsset(assetId, employeeId, allocatedDate, userId) {
    const asset = await assetsRepository.getAssetById(assetId);
    if (!asset) throw { statusCode: 404, message: 'Asset not found', isOperational: true };
    if (asset.status !== 'Available') throw { statusCode: 400, message: 'Asset is not available for allocation', isOperational: true };

    const oldAssetData = { ...asset };

    // Update asset status
    const updatedAsset = await assetsRepository.updateAssetStatus(assetId, 'Allocated');
    
    // Create allocation record
    const allocation = await assetsRepository.allocateAsset(assetId, employeeId, userId, allocatedDate);
    
    // Audit
    await auditService.logAction('assets', 'UPDATE_ALLOCATE', assetId, oldAssetData, updatedAsset, userId);
    await assetsRepository.addHistory(assetId, 'Asset Allocated', `Allocated to employee ID ${employeeId}`, userId);

    // Get Employee User ID for Notification
    const empResult = await pool.query('SELECT user_id FROM employee_profiles WHERE id = $1', [employeeId]);
    if (empResult.rows.length > 0) {
      const empUserId = empResult.rows[0].user_id;
      await notificationsService.sendNotification(empUserId, 'Asset Assigned', `Asset ${asset.asset_name} (${asset.asset_code}) has been assigned to you.`);
    }

    return allocation;
  }

  async returnAsset(assetId, returnDate, status, remarks, userId) {
    const asset = await assetsRepository.getAssetById(assetId);
    if (!asset || asset.status !== 'Allocated') throw { statusCode: 400, message: 'Asset is not currently allocated', isOperational: true };

    const allocation = await assetsRepository.getActiveAllocation(assetId);
    if (allocation) {
      await assetsRepository.returnAsset(allocation.id, returnDate);
    }

    const oldAssetData = { ...asset };
    const updatedAsset = await assetsRepository.updateAssetStatus(assetId, status || 'Available');

    await auditService.logAction('assets', 'UPDATE_RETURN', assetId, oldAssetData, updatedAsset, userId);
    await assetsRepository.addHistory(assetId, 'Asset Returned', remarks || `Asset returned. Status changed to ${status || 'Available'}.`, userId);

    return updatedAsset;
  }

  async getAssetHistory(assetId) {
    return await assetsRepository.getAssetHistory(assetId);
  }
}

module.exports = new AssetsService();
