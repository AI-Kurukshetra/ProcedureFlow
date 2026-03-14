const { Specialty, Template, Procedure } = require('../models');
const { sequelize } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: specialties });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.id);
    if (!specialty) return res.status(404).json({ success: false, error: 'Specialty not found' });
    res.json({ success: true, data: specialty });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      include: [
        {
          model: Procedure,
          as: 'procedures',
          where: { organizationId: req.user.organizationId },
          required: false,
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('procedures.id')), 'procedureCount'],
        ],
      },
      group: ['Specialty.id'],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: specialties });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
