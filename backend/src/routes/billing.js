const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/billingController');

router.use(auth);

router.get('/suggestions/:procedureId', ctrl.getSuggestions);
router.post('/', ctrl.create);
router.get('/procedure/:procedureId', ctrl.getByProcedure);
router.put('/:id', ctrl.update);

module.exports = router;
