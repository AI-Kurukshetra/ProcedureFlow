const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StaffAssignment = sequelize.define('StaffAssignment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  procedureId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  role: {
    type: DataTypes.ENUM('primary_physician', 'assisting_physician', 'nurse', 'technician', 'anesthesiologist', 'scrub_tech'),
    allowNull: false,
  },
  assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  checkedIn: { type: DataTypes.BOOLEAN, defaultValue: false },
  checkedInAt: { type: DataTypes.DATE },
  notes: { type: DataTypes.STRING(255) },
}, {
  tableName: 'staff_assignments',
  indexes: [
    { fields: ['procedure_id'] },
    { fields: ['user_id'] },
  ],
});

module.exports = StaffAssignment;
