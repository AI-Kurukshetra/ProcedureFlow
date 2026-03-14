const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mrn: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING(20),
  },
  email: {
    type: DataTypes.STRING(255),
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  address: {
    type: DataTypes.TEXT,
  },
  insuranceInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  emrId: {
    type: DataTypes.STRING(100),
  },
}, {
  tableName: 'patients',
  indexes: [
    { fields: ['organization_id', 'mrn'], unique: true },
    { fields: ['last_name', 'first_name'] },
  ],
});

module.exports = Patient;
