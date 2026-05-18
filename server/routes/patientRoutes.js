const express = require('express');
const { body, param } = require('express-validator');
const patientController = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid patient id')];

const medicalHistoryValidation = [
  body('medicalHistory').optional().isArray().withMessage('Medical history must be an array'),
  body('medicalHistory.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medical history title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Medical history title is too long'),
  body('medicalHistory.*.description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medical history description cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Medical history description is too long'),
  body('medicalHistory.*.diagnosis')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Diagnosis is too long'),
  body('medicalHistory.*.treatment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Treatment is too long'),
  body('medicalHistory.*.recordedAt')
    .optional()
    .isISO8601()
    .withMessage('Recorded date must be a valid ISO date'),
  body('medicalHistory.*.recordedBy')
    .optional()
    .isMongoId()
    .withMessage('Recorded by must be a valid user id'),
];

const createPatientValidation = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 0, max: 130 }).withMessage('Age must be between 0 and 130'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('contact').trim().notEmpty().withMessage('Contact is required').isLength({ max: 30 }),
  body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 300 }),
  body('user').optional().isMongoId().withMessage('User must be a valid user id'),
  ...medicalHistoryValidation,
];

const updatePatientValidation = [
  ...mongoIdParam,
  body('name').optional().trim().notEmpty().withMessage('Patient name cannot be empty'),
  body('age').optional().isInt({ min: 0, max: 130 }).withMessage('Age must be between 0 and 130'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('contact').optional().trim().notEmpty().withMessage('Contact cannot be empty').isLength({ max: 30 }),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty').isLength({ max: 300 }),
  body('user').optional().isMongoId().withMessage('User must be a valid user id'),
  ...medicalHistoryValidation,
];

router.use(protect);

router
  .route('/')
  .post(authorize('admin', 'receptionist'), createPatientValidation, patientController.createPatient)
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), patientController.getPatients);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), mongoIdParam, patientController.getPatient)
  .put(authorize('admin', 'receptionist'), updatePatientValidation, patientController.updatePatient)
  .delete(authorize('admin', 'receptionist'), mongoIdParam, patientController.deletePatient);

module.exports = router;
