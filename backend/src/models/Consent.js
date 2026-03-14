const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consent = sequelize.define('Consent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  procedureId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  consentType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  signatureData: {
    type: DataTypes.TEXT,
  },
  signedAt: {
    type: DataTypes.DATE,
  },
  witnessId: {
    type: DataTypes.UUID,
  },
  isValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'consents',
  updatedAt: false,
});

module.exports = Consent;
