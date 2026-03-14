const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/patientController');

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', authorize('admin', 'physician'), auditLog('CREATE_PATIENT', 'Patient'), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('admin', 'physician'), auditLog('UPDATE_PATIENT', 'Patient'), ctrl.update);
router.delete('/:id', authorize('admin'), auditLog('DELETE_PATIENT', 'Patient'), ctrl.delete);
router.get('/:id/procedures', ctrl.getProcedureHistory);

module.exports = router;
