const { sequelize } = require('../config/database');
const { Procedure, Patient, User } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalProcedures, monthProcedures, totalPatients, avgQuality] = await Promise.all([
      Procedure.count({ where: { organizationId: orgId } }),
      Procedure.count({ where: { organizationId: orgId, procedureDate: { [Op.gte]: startOfMonth } } }),
      Patient.count({ where: { organizationId: orgId } }),
      Procedure.findOne({
        where: { organizationId: orgId, qualityScore: { [Op.not]: null } },
        attributes: [[sequelize.fn('AVG', sequelize.col('quality_score')), 'avgScore']],
        raw: true,
      }),
    ]);

    const recentProcedures = await Procedure.findAll({
      where: { organizationId: orgId },
      include: [
        { association: 'patient', attributes: ['firstName', 'lastName', 'mrn'] },
        { association: 'physician', attributes: ['firstName', 'lastName'] },
        { association: 'specialty', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalProcedures,
          monthProcedures,
          totalPatients,
          avgQualityScore: parseFloat(avgQuality?.avgScore || 0).toFixed(1),
        },
        recentProcedures,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProcedureStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { organizationId: req.user.organizationId };
    if (startDate) where.procedureDate = { [Op.gte]: startDate };
    if (endDate) where.procedureDate = { ...(where.procedureDate || {}), [Op.lte]: endDate };

    const byMonth = await Procedure.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('procedure_date')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('procedure_date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('procedure_date')), 'ASC']],
      raw: true,
    });

    const bySpecialty = await Procedure.findAll({
      where,
      attributes: [
        'specialtyId',
        [sequelize.fn('COUNT', sequelize.col('Procedure.id')), 'count'],
      ],
      include: [{ association: 'specialty', attributes: ['name', 'code'] }],
      group: ['Procedure.specialtyId', 'specialty.id'],
      raw: true,
    });

    const byStatus = await Procedure.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    res.json({ success: true, data: { byMonth, bySpecialty, byStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getQualityMetrics = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    const qualityBySpecialty = await Procedure.findAll({
      where: { organizationId: orgId, qualityScore: { [Op.not]: null } },
      attributes: [
        'specialtyId',
        [sequelize.fn('AVG', sequelize.col('quality_score')), 'avgScore'],
        [sequelize.fn('MIN', sequelize.col('quality_score')), 'minScore'],
        [sequelize.fn('MAX', sequelize.col('quality_score')), 'maxScore'],
      ],
      include: [{ association: 'specialty', attributes: ['name'] }],
      group: ['Procedure.specialtyId', 'specialty.id'],
      raw: true,
    });

    res.json({ success: true, data: { qualityBySpecialty } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCompletionRates = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const total = await Procedure.count({ where: { organizationId: orgId } });
    const completed = await Procedure.count({ where: { organizationId: orgId, status: 'completed' } });
    const signed = await Procedure.count({ where: { organizationId: orgId, status: 'signed' } });

    res.json({
      success: true,
      data: {
        total,
        completed,
        signed,
        completionRate: total > 0 ? ((completed + signed) / total * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
