const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/patients', require('./patients'));
router.use('/procedures', require('./procedures'));
router.use('/templates', require('./templates'));
router.use('/reports', require('./reports'));
router.use('/billing', require('./billing'));
router.use('/analytics', require('./analytics'));
router.use('/compliance', require('./compliance'));
router.use('/scheduling', require('./scheduling'));
router.use('/notifications', require('./notifications'));
router.use('/consents', require('./consents'));
router.use('/users', require('./users'));
router.use('/specialties', require('./specialties'));
router.use('/integrations', require('./integrations'));
router.use('/staff', require('./staff'));

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date(), version: '1.0.0' } });
});

module.exports = router;
