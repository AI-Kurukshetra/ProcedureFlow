const router = require('express').Router();
const auth = require('../middleware/auth');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/reportController');

router.use(auth);

router.post('/generate', auditLog('GENERATE_REPORT', 'Report'), ctrl.generate);
router.get('/procedure/:procedureId', ctrl.getByProcedure);
router.get('/:id/download', ctrl.download);

module.exports = router;
