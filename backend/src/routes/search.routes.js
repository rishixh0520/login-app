const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

router.get('/', searchController.globalSearch);

module.exports = router;
