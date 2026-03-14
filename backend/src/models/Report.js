const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  procedureId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('pdf', 'hl7', 'structured'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
  },
  filePath: {
    type: DataTypes.STRING(500),
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'reports',
  updatedAt: false,
});

module.exports = Report;
