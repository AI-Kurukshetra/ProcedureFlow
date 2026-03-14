const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/userController');

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', authorize('admin'), auditLog('CREATE_USER', 'User'), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('admin'), auditLog('UPDATE_USER', 'User'), ctrl.update);
router.patch('/:id/deactivate', authorize('admin'), auditLog('DEACTIVATE_USER', 'User'), ctrl.deactivate);
router.patch('/:id/activate', authorize('admin'), auditLog('ACTIVATE_USER', 'User'), ctrl.activate);
router.patch('/:id/reset-password', authorize('admin'), auditLog('RESET_PASSWORD', 'User'), ctrl.resetPassword);

module.exports = router;
