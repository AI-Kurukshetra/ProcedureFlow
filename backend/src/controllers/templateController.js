const { v4: uuidv4 } = require('uuid');
const { Template, Specialty, User } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { specialtyId, isActive } = req.query;
    const where = { organizationId: req.user.organizationId };
    if (specialtyId) where.specialtyId = specialtyId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await Template.findAll({
      where,
      include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [{ model: Specialty, as: 'specialty' }],
    });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const template = await Template.create({
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    await template.update({ ...req.body, version: template.version + 1 });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    await template.update({ isActive: false });
    res.json({ success: true, data: { message: 'Template deactivated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.clone = async (req, res) => {
  try {
    const source = await Template.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!source) return res.status(404).json({ success: false, error: 'Template not found' });

    const cloned = await Template.create({
      organizationId: req.user.organizationId,
      specialtyId: source.specialtyId,
      name: `${source.name} (Copy)`,
      description: source.description,
      fields: source.fields,
      createdBy: req.user.id,
      version: 1,
    });
    res.status(201).json({ success: true, data: cloned });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBySpecialty = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: {
        specialtyId: req.params.specialtyId,
        organizationId: req.user.organizationId,
        isActive: true,
      },
    });
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
