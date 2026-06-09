const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

router.get('/export', reportsController.downloadReport);

module.exports = router;
