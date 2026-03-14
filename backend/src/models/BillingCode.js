const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BillingCode = sequelize.define('BillingCode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  procedureId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  cptCode: {
    type: DataTypes.STRING(20),
  },
  icdCode: {
    type: DataTypes.STRING(20),
  },
  description: {
    type: DataTypes.TEXT,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  status: {
    type: DataTypes.ENUM('suggested', 'confirmed', 'billed'),
    defaultValue: 'suggested',
  },
}, {
  tableName: 'billing_codes',
  updatedAt: false,
});

module.exports = BillingCode;
