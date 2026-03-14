const { Op } = require('sequelize');
const { Patient, Procedure, User, Specialty } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, gender, sortBy = 'lastName', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    const where = { organizationId: req.user.organizationId };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { mrn: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (gender) where.gender = gender;

    const { count, rows } = await Patient.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
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
    const patient = await Patient.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const patient = await Patient.create({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, error: 'MRN already exists for this organization' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    await patient.update(req.body);
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    await patient.destroy();
    res.json({ success: true, data: { message: 'Patient deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProcedureHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const procedures = await Procedure.findAll({
      where: { patientId: req.params.id },
      include: [
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name', 'code'] },
      ],
      order: [['procedureDate', 'DESC']],
    });

    res.json({ success: true, data: procedures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
