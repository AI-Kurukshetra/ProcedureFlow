const { BillingCode, Procedure } = require('../models');

// CPT/ICD code suggestions based on specialty and procedure title keywords
const BILLING_SUGGESTIONS = {
  GI: [
    { cptCode: '43239', icdCode: 'K21.0', description: 'Upper GI endoscopy with biopsy', amount: 450.00 },
    { cptCode: '45378', icdCode: 'Z12.11', description: 'Colonoscopy diagnostic', amount: 650.00 },
    { cptCode: '45380', icdCode: 'K57.30', description: 'Colonoscopy with biopsy', amount: 750.00 },
  ],
  PULM: [
    { cptCode: '31622', icdCode: 'J18.9', description: 'Bronchoscopy with BAL', amount: 800.00 },
    { cptCode: '31625', icdCode: 'C34.10', description: 'Bronchoscopy with biopsy', amount: 950.00 },
  ],
  CARD: [
    { cptCode: '93452', icdCode: 'I25.10', description: 'Left heart catheterization', amount: 2500.00 },
    { cptCode: '93458', icdCode: 'I21.9', description: 'Left heart cath with ventriculography', amount: 3200.00 },
  ],
};

exports.getSuggestions = async (req, res) => {
  try {
    const procedure = await Procedure.findOne({
      where: { id: req.params.procedureId, organizationId: req.user.organizationId },
      include: [{ association: 'specialty' }],
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    const specialtyCode = procedure.specialty?.code || 'GI';
    const suggestions = BILLING_SUGGESTIONS[specialtyCode] || BILLING_SUGGESTIONS['GI'];

    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const billingCode = await BillingCode.create(req.body);
    res.status(201).json({ success: true, data: billingCode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByProcedure = async (req, res) => {
  try {
    const codes = await BillingCode.findAll({
      where: { procedureId: req.params.procedureId },
      order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, data: codes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const code = await BillingCode.findByPk(req.params.id);
    if (!code) return res.status(404).json({ success: false, error: 'Billing code not found' });
    await code.update(req.body);
    res.json({ success: true, data: code });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
