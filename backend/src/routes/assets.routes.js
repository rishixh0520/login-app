const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assets.controller');
const { validateAsset, validateAllocation } = require('../validators/assets.validator');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

router.get('/', assetsController.getAssets);
router.post('/', validateAsset, assetsController.createAsset);
router.post('/:id/allocate', validateAllocation, assetsController.allocateAsset);
router.post('/:id/return', assetsController.returnAsset);
router.get('/:id/history', assetsController.getAssetHistory);

module.exports = router;
