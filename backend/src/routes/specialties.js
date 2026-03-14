const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/specialtyController');

router.use(auth);

router.get('/', ctrl.getAll);
router.get('/stats', ctrl.getStats);
router.get('/:id', ctrl.getById);

module.exports = router;
