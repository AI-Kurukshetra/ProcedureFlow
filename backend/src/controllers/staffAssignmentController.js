const { StaffAssignment, User, Procedure } = require('../models');

exports.getByProcedure = async (req, res) => {
  try {
    const assignments = await StaffAssignment.findAll({
      where: { procedureId: req.params.procedureId },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role', 'email'] }],
      order: [['assignedAt', 'ASC']],
    });
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.assign = async (req, res) => {
  try {
    const procedure = await Procedure.findOne({
      where: { id: req.params.procedureId, organizationId: req.user.organizationId },
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    const existing = await StaffAssignment.findOne({
      where: { procedureId: req.params.procedureId, userId: req.body.userId },
    });
    if (existing) return res.status(409).json({ success: false, error: 'User already assigned to this procedure' });

    const assignment = await StaffAssignment.create({
      procedureId: req.params.procedureId,
      userId: req.body.userId,
      role: req.body.role,
      notes: req.body.notes,
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const assignment = await StaffAssignment.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });
    await assignment.update({ checkedIn: true, checkedInAt: new Date() });
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const assignment = await StaffAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });
    await assignment.destroy();
    res.json({ success: true, data: { message: 'Staff assignment removed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
