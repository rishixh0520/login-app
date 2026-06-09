const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

router.get('/mine', notificationsController.getMyNotifications);
router.put('/:id/read', notificationsController.markAsRead);

module.exports = router;
