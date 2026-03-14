const { Consent, Patient, Procedure, User } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { patientId, procedureId, status } = req.query;
    const where = {};
    if (patientId) where.patientId = patientId;
    if (procedureId) where.procedureId = procedureId;
    if (status) where.status = status;

    const consents = await Consent.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'mrn'] },
        { model: User, as: 'witness', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: consents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const consent = await Consent.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Procedure, as: 'procedure' },
        { model: User, as: 'witness', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    res.json({ success: true, data: consent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const consent = await Consent.create({
      ...req.body,
      witnessId: req.body.witnessId || req.user.id,
    });
    res.status(201).json({ success: true, data: consent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sign = async (req, res) => {
  try {
    const consent = await Consent.findByPk(req.params.id);
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    const { signatureData, signerName } = req.body;
    await consent.update({
      status: 'signed',
      signedAt: new Date(),
      signatureData,
      signerName,
    });
    res.json({ success: true, data: consent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.revoke = async (req, res) => {
  try {
    const consent = await Consent.findByPk(req.params.id);
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    await consent.update({ status: 'revoked', revokedAt: new Date(), revokeReason: req.body.reason });
    res.json({ success: true, data: consent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const consents = await Consent.findAll({
      where: { patientId: req.params.patientId },
      include: [
        { model: Procedure, as: 'procedure', attributes: ['id', 'title', 'procedureDate'] },
        { model: User, as: 'witness', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: consents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
