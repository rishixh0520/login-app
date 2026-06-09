const notificationsService = require('../services/notifications.service');

class NotificationsController {
  async getMyNotifications(req, res, next) {
    try {
      const notifications = await notificationsService.getMyNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationsService.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationsController();
