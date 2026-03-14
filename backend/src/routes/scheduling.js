const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/schedulingController');

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', authorize('admin', 'physician', 'nurse'), auditLog('CREATE_SCHEDULE', 'Schedule'), ctrl.create);
router.get('/today', ctrl.getTodaySchedule);
router.get('/physician/:physicianId', ctrl.getByPhysician);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('admin', 'physician', 'nurse'), auditLog('UPDATE_SCHEDULE', 'Schedule'), ctrl.update);
router.patch('/:id/cancel', authorize('admin', 'physician'), auditLog('CANCEL_SCHEDULE', 'Schedule'), ctrl.cancel);
router.post('/:id/convert', authorize('admin', 'physician'), auditLog('CONVERT_SCHEDULE', 'Schedule'), ctrl.convertToProcedure);

module.exports = router;
