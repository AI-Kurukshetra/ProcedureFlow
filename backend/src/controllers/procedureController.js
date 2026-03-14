const { Op } = require('sequelize');
const path = require('path');
const { Procedure, Patient, User, Template, Specialty, ProcedureImage } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, specialtyId, physicianId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { organizationId: req.user.organizationId };
    if (status) where.status = status;
    if (specialtyId) where.specialtyId = specialtyId;
    if (physicianId) where.physicianId = physicianId;
    if (startDate || endDate) {
      where.procedureDate = {};
      if (startDate) where.procedureDate[Op.gte] = startDate;
      if (endDate) where.procedureDate[Op.lte] = endDate;
    }

    const { count, rows } = await Procedure.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['procedureDate', 'DESC']],
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'mrn'] },
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name', 'code'] },
      ],
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
    const procedure = await Procedure.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Template, as: 'template' },
        { model: Specialty, as: 'specialty' },
        { model: ProcedureImage, as: 'images' },
      ],
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });
    res.json({ success: true, data: procedure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const procedure = await Procedure.create({
      ...req.body,
      organizationId: req.user.organizationId,
      physicianId: req.body.physicianId || req.user.id,
    });
    res.status(201).json({ success: true, data: procedure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const procedure = await Procedure.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });
    await procedure.update(req.body);
    res.json({ success: true, data: procedure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const procedure = await Procedure.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });
    await procedure.destroy();
    res.json({ success: true, data: { message: 'Procedure deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      draft: ['in-progress'],
      'in-progress': ['completed', 'draft'],
      completed: ['signed'],
      signed: [],
    };

    const procedure = await Procedure.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    if (!validTransitions[procedure.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from ${procedure.status} to ${status}`,
      });
    }

    const updates = { status };
    if (status === 'in-progress' && !procedure.startTime) updates.startTime = new Date();
    if (status === 'completed' && !procedure.endTime) updates.endTime = new Date();

    await procedure.update(updates);

    // Emit socket event
    req.app.get('io')?.to(procedure.organizationId).emit('procedure:status_change', {
      procedureId: procedure.id,
      status,
    });

    res.json({ success: true, data: procedure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.autoSave = async (req, res) => {
  try {
    const procedure = await Procedure.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    const { documentationData, notes, findings, impression } = req.body;
    await procedure.update({ documentationData, notes, findings, impression });

    res.json({ success: true, data: { savedAt: new Date() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const procedure = await Procedure.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    const image = await ProcedureImage.create({
      procedureId: procedure.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      capturedAt: new Date(),
    });

    res.status(201).json({ success: true, data: image });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const image = await ProcedureImage.findOne({
      where: { id: req.params.imageId, procedureId: req.params.id },
    });
    if (!image) return res.status(404).json({ success: false, error: 'Image not found' });
    await image.destroy();
    res.json({ success: true, data: { message: 'Image removed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const procedures = await Procedure.findAll({
      where: { patientId: req.params.patientId, organizationId: req.user.organizationId },
      include: [
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
      ],
      order: [['procedureDate', 'DESC']],
    });
    res.json({ success: true, data: procedures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByPhysician = async (req, res) => {
  try {
    const procedures = await Procedure.findAll({
      where: { physicianId: req.params.physicianId, organizationId: req.user.organizationId },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'mrn'] },
        { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
      ],
      order: [['procedureDate', 'DESC']],
    });
    res.json({ success: true, data: procedures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
