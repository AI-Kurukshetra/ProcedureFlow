const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const auditLog = require('../middleware/audit');
const ctrl = require('../controllers/procedureController');
const config = require('../config/app');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(config.upload.path, 'procedures', req.params.id || 'temp');
    const fs = require('fs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', authorize('physician', 'nurse', 'admin'), auditLog('CREATE_PROCEDURE', 'Procedure'), ctrl.create);
router.get('/by-patient/:patientId', ctrl.getByPatient);
router.get('/by-physician/:physicianId', ctrl.getByPhysician);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('physician', 'nurse', 'admin'), auditLog('UPDATE_PROCEDURE', 'Procedure'), ctrl.update);
router.delete('/:id', authorize('admin'), auditLog('DELETE_PROCEDURE', 'Procedure'), ctrl.delete);
router.patch('/:id/status', authorize('physician', 'admin'), auditLog('STATUS_CHANGE', 'Procedure'), ctrl.updateStatus);
router.post('/:id/auto-save', ctrl.autoSave);
router.post('/:id/images', upload.single('image'), ctrl.addImage);
router.delete('/:id/images/:imageId', authorize('physician', 'admin'), ctrl.removeImage);

module.exports = router;
