const notificationsRepository = require('../repositories/notifications.repository');

class NotificationsService {
  async sendNotification(userId, title, message) {
    return await notificationsRepository.createNotification(userId, title, message);
  }

  async getMyNotifications(userId) {
    return await notificationsRepository.getUserNotifications(userId);
  }

  async markNotificationAsRead(id) {
    return await notificationsRepository.markAsRead(id);
  }
}

module.exports = new NotificationsService();
