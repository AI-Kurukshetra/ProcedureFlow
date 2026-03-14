const { User, Specialty, Organization } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = { organizationId: req.user.organizationId };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'code'] }],
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
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
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include: [{ model: Specialty, as: 'specialty' }],
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

    const user = await User.create({
      ...req.body,
      organizationId: req.user.organizationId,
      passwordHash: req.body.password,
    });

    const result = user.toJSON();
    delete result.passwordHash;
    delete result.refreshToken;
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const { password, ...rest } = req.body;
    await user.update(rest);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deactivate = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    await user.update({ isActive: false });
    res.json({ success: true, data: { message: 'User deactivated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.activate = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    await user.update({ isActive: true });
    res.json({ success: true, data: { message: 'User activated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    await user.update({ passwordHash: req.body.newPassword });
    res.json({ success: true, data: { message: 'Password reset successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
