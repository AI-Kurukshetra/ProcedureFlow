const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProcedureImage = sequelize.define('ProcedureImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  procedureId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING(255),
  },
  fileSize: {
    type: DataTypes.INTEGER,
  },
  mimeType: {
    type: DataTypes.STRING(100),
  },
  annotation: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  capturedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'procedure_images',
  updatedAt: false,
});

module.exports = ProcedureImage;
