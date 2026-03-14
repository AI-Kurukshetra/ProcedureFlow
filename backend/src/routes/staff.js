const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/staffAssignmentController');

router.use(auth);

router.get('/procedure/:procedureId', ctrl.getByProcedure);
router.post('/procedure/:procedureId', authorize('admin', 'physician'), auditLog('ASSIGN_STAFF', 'Procedure'), ctrl.assign);
router.patch('/:id/check-in', ctrl.checkIn);
router.delete('/:id', authorize('admin', 'physician'), ctrl.remove);

module.exports = router;
