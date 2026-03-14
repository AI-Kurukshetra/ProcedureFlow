const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'procedure_created', 'procedure_completed', 'procedure_signed',
      'schedule_reminder', 'report_ready', 'consent_required',
      'quality_alert', 'system_alert', 'billing_pending'
    ),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  entityType: { type: DataTypes.STRING(50) },
  entityId: { type: DataTypes.UUID },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt: { type: DataTypes.DATE },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['organization_id', 'created_at'] },
  ],
});

module.exports = Notification;
