const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/integrationController');

router.use(auth);

router.get('/emr-systems', ctrl.getEmrSystems);
router.post('/emr-sync', ctrl.emrSync);
router.get('/hl7/:procedureId', ctrl.hl7Export);
router.get('/fhir/:procedureId', ctrl.fhirExport);
router.post('/voice-transcribe', ctrl.voiceTranscribe);

module.exports = router;
