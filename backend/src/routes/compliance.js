const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/complianceController');

router.use(auth);

router.get('/audit-log', authorize('admin'), ctrl.getAuditLog);
router.post('/report', authorize('admin'), ctrl.generateReport);
router.get('/audit-trail/:entityType/:entityId', authorize('admin', 'physician'), ctrl.getAuditTrail);

module.exports = router;
