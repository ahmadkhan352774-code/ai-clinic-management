const express = require('express');
const { body, param } = require('express-validator');
const prescriptionController = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid prescription id')];
const doctorIdParam = [param('doctorId').isMongoId().withMessage('Invalid doctor id')];
const patientIdParam = [param('patientId').isMongoId().withMessage('Invalid patient id')];

const medicinesValidation = [
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.medicineName')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required')
    .isLength({ max: 120 })
    .withMessage('Medicine name is too long'),
  body('medicines.*.dosage')
    .trim()
    .notEmpty()
    .withMessage('Dosage is required')
    .isLength({ max: 120 })
    .withMessage('Dosage is too long'),
  body('medicines.*.timing')
    .trim()
    .notEmpty()
    .withMessage('Timing is required')
    .isLength({ max: 120 })
    .withMessage('Timing is too long'),
  body('medicines.*.duration')
    .trim()
    .notEmpty()
    .withMessage('Duration is required')
    .isLength({ max: 120 })
    .withMessage('Duration is too long'),
];

const createPrescriptionValidation = [
  body('patientId').isMongoId().withMessage('Patient id is required'),
  body('doctorId').isMongoId().withMessage('Doctor id is required'),
  body('appointmentId').optional().isMongoId().withMessage('Appointment id must be valid'),
  ...medicinesValidation,
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis is required')
    .isLength({ max: 1000 })
    .withMessage('Diagnosis is too long'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
  body('instructions').optional().trim().isLength({ max: 2000 }).withMessage('Instructions are too long'),
];

const updatePrescriptionValidation = [
  ...mongoIdParam,
  body('patientId').optional().isMongoId().withMessage('Patient id must be valid'),
  body('doctorId').optional().isMongoId().withMessage('Doctor id must be valid'),
  body('appointmentId').optional().isMongoId().withMessage('Appointment id must be valid'),
  body('medicines').optional().isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.medicineName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medicine name cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Medicine name is too long'),
  body('medicines.*.dosage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Dosage cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Dosage is too long'),
  body('medicines.*.timing')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Timing cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Timing is too long'),
  body('medicines.*.duration')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Duration cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Duration is too long'),
  body('diagnosis')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Diagnosis cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Diagnosis is too long'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
  body('instructions').optional().trim().isLength({ max: 2000 }).withMessage('Instructions are too long'),
];

router.use(protect);

router.get('/doctor/me', authorize('doctor'), prescriptionController.getDoctorPrescriptions);

router.get(
  '/doctor/:doctorId',
  authorize('admin', 'doctor', 'receptionist'),
  doctorIdParam,
  prescriptionController.getDoctorPrescriptions
);

router.get(
  '/patient/:patientId/history',
  authorize('admin', 'doctor', 'receptionist', 'patient'),
  patientIdParam,
  prescriptionController.getPatientHistory
);

router
  .route('/')
  .post(authorize('admin', 'doctor'), createPrescriptionValidation, prescriptionController.createPrescription)
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), prescriptionController.getPrescriptions);

router.get(
  '/:id/pdf',
  authorize('admin', 'doctor', 'receptionist', 'patient'),
  mongoIdParam,
  prescriptionController.downloadPrescriptionPdf
);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), mongoIdParam, prescriptionController.getPrescription)
  .put(authorize('admin', 'doctor'), updatePrescriptionValidation, prescriptionController.updatePrescription)
  .delete(authorize('admin', 'doctor'), mongoIdParam, prescriptionController.deletePrescription);

module.exports = router;
