const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Procedure = sequelize.define('Procedure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  physicianId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  specialtyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'in-progress', 'completed', 'signed'),
    defaultValue: 'draft',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  procedureDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
  },
  endTime: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  findings: {
    type: DataTypes.TEXT,
  },
  impression: {
    type: DataTypes.TEXT,
  },
  complications: {
    type: DataTypes.TEXT,
  },
  medications: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  equipment: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  documentationData: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  qualityScore: {
    type: DataTypes.DECIMAL(5, 2),
  },
}, {
  tableName: 'procedures',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['physician_id'] },
    { fields: ['organization_id', 'status'] },
    { fields: ['procedure_date'] },
  ],
});

module.exports = Procedure;
