const { Notification, User } = require('../models');
const { Op } = require('sequelize');

exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });

    res.json({
      success: true,
      data: rows,
      unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return res.status(404).json({ success: false, error: 'Notification not found' });
    await notif.update({ isRead: true, readAt: new Date() });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return res.status(404).json({ success: false, error: 'Notification not found' });
    await notif.destroy();
    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Internal helper to create notifications (used by other controllers)
exports.createNotification = async ({ userId, organizationId, type, title, message, entityType, entityId, priority = 'medium', metadata = {} }) => {
  try {
    const notif = await Notification.create({ userId, organizationId, type, title, message, entityType, entityId, priority, metadata });
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};
