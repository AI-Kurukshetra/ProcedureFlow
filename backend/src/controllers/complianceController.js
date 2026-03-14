const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

exports.getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const where = {};
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(endDate) };

    const logs = await AuditLog.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
    });

    const summary = {
      totalActions: logs.length,
      byAction: {},
      byEntityType: {},
      period: { startDate, endDate },
      generatedAt: new Date(),
    };

    logs.forEach((log) => {
      summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
      if (log.entityType) {
        summary.byEntityType[log.entityType] = (summary.byEntityType[log.entityType] || 0) + 1;
      }
    });

    res.json({ success: true, data: { summary, logs } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAuditTrail = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await AuditLog.findAll({
      where: { entityType, entityId },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
