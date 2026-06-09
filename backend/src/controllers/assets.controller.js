const assetsService = require('../services/assets.service');

class AssetsController {
  async getAssets(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const result = await assetsService.getAllAssets(page, limit, status);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createAsset(req, res, next) {
    try {
      const asset = await assetsService.createAsset(req.body, req.user.id);
      res.status(201).json(asset);
    } catch (error) {
      next(error);
    }
  }

  async allocateAsset(req, res, next) {
    try {
      const { id } = req.params;
      const { employee_id, allocated_date } = req.body;
      const allocation = await assetsService.allocateAsset(id, employee_id, allocated_date, req.user.id);
      res.json(allocation);
    } catch (error) {
      next(error);
    }
  }

  async returnAsset(req, res, next) {
    try {
      const { id } = req.params;
      const { return_date, status, remarks } = req.body;
      const asset = await assetsService.returnAsset(id, return_date, status, remarks, req.user.id);
      res.json(asset);
    } catch (error) {
      next(error);
    }
  }

  async getAssetHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await assetsService.getAssetHistory(id);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetsController();
