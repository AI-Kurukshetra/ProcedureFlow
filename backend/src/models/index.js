const Organization = require('./Organization');
const Specialty = require('./Specialty');
const User = require('./User');
const Patient = require('./Patient');
const Template = require('./Template');
const Procedure = require('./Procedure');
const Report = require('./Report');
const AuditLog = require('./AuditLog');
const BillingCode = require('./BillingCode');
const Consent = require('./Consent');
const ProcedureImage = require('./ProcedureImage');
const Schedule = require('./Schedule');
const Notification = require('./Notification');
const StaffAssignment = require('./StaffAssignment');

// Organization associations
Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
Organization.hasMany(Patient, { foreignKey: 'organizationId', as: 'patients' });
Organization.hasMany(Template, { foreignKey: 'organizationId', as: 'templates' });
Organization.hasMany(Procedure, { foreignKey: 'organizationId', as: 'procedures' });
Organization.hasMany(Schedule, { foreignKey: 'organizationId', as: 'schedules' });

// User associations
User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
User.belongsTo(Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
User.hasMany(Procedure, { foreignKey: 'physicianId', as: 'procedures' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
User.hasMany(Schedule, { foreignKey: 'physicianId', as: 'schedules' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(StaffAssignment, { foreignKey: 'userId', as: 'staffAssignments' });

// Specialty associations
Specialty.hasMany(User, { foreignKey: 'specialtyId', as: 'users' });
Specialty.hasMany(Template, { foreignKey: 'specialtyId', as: 'templates' });
Specialty.hasMany(Procedure, { foreignKey: 'specialtyId', as: 'procedures' });
Specialty.hasMany(Schedule, { foreignKey: 'specialtyId', as: 'schedules' });

// Patient associations
Patient.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Patient.hasMany(Procedure, { foreignKey: 'patientId', as: 'procedures' });
Patient.hasMany(Consent, { foreignKey: 'patientId', as: 'consents' });
Patient.hasMany(Schedule, { foreignKey: 'patientId', as: 'schedules' });

// Template associations
Template.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Template.belongsTo(Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
Template.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Template.hasMany(Procedure, { foreignKey: 'templateId', as: 'procedures' });

// Procedure associations
Procedure.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Procedure.belongsTo(User, { foreignKey: 'physicianId', as: 'physician' });
Procedure.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });
Procedure.belongsTo(Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
Procedure.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Procedure.hasMany(Report, { foreignKey: 'procedureId', as: 'reports' });
Procedure.hasMany(BillingCode, { foreignKey: 'procedureId', as: 'billingCodes' });
Procedure.hasMany(ProcedureImage, { foreignKey: 'procedureId', as: 'images' });
Procedure.hasMany(Consent, { foreignKey: 'procedureId', as: 'consents' });
Procedure.hasMany(StaffAssignment, { foreignKey: 'procedureId', as: 'staffAssignments' });

// Report associations
Report.belongsTo(Procedure, { foreignKey: 'procedureId', as: 'procedure' });
Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'generatedByUser' });

// BillingCode associations
BillingCode.belongsTo(Procedure, { foreignKey: 'procedureId', as: 'procedure' });

// ProcedureImage associations
ProcedureImage.belongsTo(Procedure, { foreignKey: 'procedureId', as: 'procedure' });

// Consent associations
Consent.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Consent.belongsTo(Procedure, { foreignKey: 'procedureId', as: 'procedure' });
Consent.belongsTo(User, { foreignKey: 'witnessId', as: 'witness' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Schedule associations
Schedule.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Schedule.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Schedule.belongsTo(User, { foreignKey: 'physicianId', as: 'physician' });
Schedule.belongsTo(Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
Schedule.belongsTo(Procedure, { foreignKey: 'procedureId', as: 'procedure' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// StaffAssignment associations
StaffAssignment.belongsTo(Procedure, { foreignKey: 'procedureId', as: 'procedure' });
StaffAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  Organization, Specialty, User, Patient, Template, Procedure,
  Report, AuditLog, BillingCode, Consent, ProcedureImage,
  Schedule, Notification, StaffAssignment,
};
