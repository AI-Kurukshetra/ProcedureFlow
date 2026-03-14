const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/consentController');

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', authorize('admin', 'physician', 'nurse'), auditLog('CREATE_CONSENT', 'Consent'), ctrl.create);
router.get('/patient/:patientId', ctrl.getByPatient);
router.get('/:id', ctrl.getById);
router.patch('/:id/sign', auditLog('SIGN_CONSENT', 'Consent'), ctrl.sign);
router.patch('/:id/revoke', authorize('admin', 'physician'), auditLog('REVOKE_CONSENT', 'Consent'), ctrl.revoke);

module.exports = router;
