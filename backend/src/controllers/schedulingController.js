const { Op } = require('sequelize');
const { Schedule, Patient, User, Specialty, Procedure } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { date, physicianId, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const where = { organizationId: req.user.organizationId };
    if (status) where.status = status;
    if (physicianId) where.physicianId = physicianId;
    if (date) where.scheduledDate = date;
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate[Op.gte] = startDate;
      if (endDate) where.scheduledDate[Op.lte] = endDate;
    }

    const { count, rows } = await Schedule.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'mrn', 'dateOfBirth'] },
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name', 'code'] },
      ],
      order: [['scheduledDate', 'ASC'], ['scheduledTime', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Specialty, as: 'specialty' },
      ],
    });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const schedule = await Schedule.create({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    await schedule.update(req.body);
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    await schedule.update({ status: 'cancelled', cancelReason: req.body.reason });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTodaySchedule = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const schedules = await Schedule.findAll({
      where: {
        organizationId: req.user.organizationId,
        scheduledDate: today,
        status: { [Op.notIn]: ['cancelled'] },
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'mrn'] },
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name', 'code'] },
      ],
      order: [['scheduledTime', 'ASC']],
    });
    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByPhysician = async (req, res) => {
  try {
    const { date } = req.query;
    const where = { organizationId: req.user.organizationId, physicianId: req.params.physicianId };
    if (date) where.scheduledDate = date;

    const schedules = await Schedule.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'mrn'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
      ],
      order: [['scheduledDate', 'ASC'], ['scheduledTime', 'ASC']],
    });
    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.convertToProcedure = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const procedure = await Procedure.create({
      organizationId: schedule.organizationId,
      patientId: schedule.patientId,
      physicianId: schedule.physicianId,
      specialtyId: schedule.specialtyId,
      templateId: schedule.templateId || null,
      title: schedule.procedureType,
      procedureDate: schedule.scheduledDate,
      status: 'draft',
      notes: schedule.notes || '',
    });

    await schedule.update({ status: 'in-progress', procedureId: procedure.id });
    res.status(201).json({ success: true, data: { procedure, schedule } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
