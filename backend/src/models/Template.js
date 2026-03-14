const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  specialtyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  fields: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    // Each field: { id, label, type, required, order, options[] }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  createdBy: {
    type: DataTypes.UUID,
  },
}, {
  tableName: 'templates',
});

module.exports = Template;
