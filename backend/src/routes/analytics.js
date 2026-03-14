const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.use(auth);

router.get('/dashboard', ctrl.getDashboard);
router.get('/procedures', ctrl.getProcedureStats);
router.get('/quality', ctrl.getQualityMetrics);
router.get('/completion-rates', ctrl.getCompletionRates);

module.exports = router;
