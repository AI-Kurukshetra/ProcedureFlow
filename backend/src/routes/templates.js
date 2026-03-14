const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/templateController');

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', authorize('admin'), auditLog('CREATE_TEMPLATE', 'Template'), ctrl.create);
router.get('/specialty/:specialtyId', ctrl.getBySpecialty);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('admin'), auditLog('UPDATE_TEMPLATE', 'Template'), ctrl.update);
router.delete('/:id', authorize('admin'), auditLog('DELETE_TEMPLATE', 'Template'), ctrl.delete);
router.post('/:id/clone', authorize('admin'), auditLog('CLONE_TEMPLATE', 'Template'), ctrl.clone);

module.exports = router;
