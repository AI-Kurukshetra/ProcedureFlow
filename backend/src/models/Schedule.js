const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  patientId: { type: DataTypes.UUID, allowNull: false },
  physicianId: { type: DataTypes.UUID, allowNull: false },
  specialtyId: { type: DataTypes.UUID, allowNull: false },
  templateId: { type: DataTypes.UUID, allowNull: true },
  procedureId: { type: DataTypes.UUID, allowNull: true }, // linked after created
  scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
  scheduledTime: { type: DataTypes.TIME, allowNull: false },
  estimatedDuration: { type: DataTypes.INTEGER, defaultValue: 60 }, // minutes
  room: { type: DataTypes.STRING(50) },
  procedureType: { type: DataTypes.STRING(255), allowNull: false },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'scheduled',
  },
  priority: { type: DataTypes.ENUM('routine', 'urgent', 'emergency'), defaultValue: 'routine' },
  notes: { type: DataTypes.TEXT },
  preAuthNumber: { type: DataTypes.STRING(100) },
  cancelReason: { type: DataTypes.TEXT },
}, {
  tableName: 'schedules',
  indexes: [
    { fields: ['organization_id', 'scheduled_date'] },
    { fields: ['physician_id', 'scheduled_date'] },
    { fields: ['patient_id'] },
  ],
});

module.exports = Schedule;
