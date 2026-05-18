const express = require('express');
const { body, param } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Appointment = require('../models/Appointment');

const router = express.Router();

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid appointment id')];
const doctorIdParam = [param('doctorId').isMongoId().withMessage('Invalid doctor id')];
const patientIdParam = [param('patientId').isMongoId().withMessage('Invalid patient id')];

const appointmentFieldsValidation = [
  body('patientId').isMongoId().withMessage('Patient id is required'),
  body('doctorId').isMongoId().withMessage('Doctor id is required'),
  body('appointmentDate').isISO8601().withMessage('Appointment date must be a valid ISO date'),
  body('appointmentTime')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Appointment time must use HH:mm format'),
  body('symptoms')
    .trim()
    .notEmpty()
    .withMessage('Symptoms are required')
    .isLength({ max: 1000 })
    .withMessage('Symptoms are too long'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
  body('status')
    .optional()
    .isIn(Appointment.statuses)
    .withMessage(`Status must be one of: ${Appointment.statuses.join(', ')}`),
];

const updateAppointmentValidation = [
  ...mongoIdParam,
  body('patientId').optional().isMongoId().withMessage('Patient id must be valid'),
  body('doctorId').optional().isMongoId().withMessage('Doctor id must be valid'),
  body('appointmentDate').optional().isISO8601().withMessage('Appointment date must be a valid ISO date'),
  body('appointmentTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Appointment time must use HH:mm format'),
  body('symptoms')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Symptoms cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Symptoms are too long'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
  body('status')
    .optional()
    .isIn(Appointment.statuses)
    .withMessage(`Status must be one of: ${Appointment.statuses.join(', ')}`),
];

const statusValidation = [
  ...mongoIdParam,
  body('status')
    .isIn(Appointment.statuses)
    .withMessage(`Status must be one of: ${Appointment.statuses.join(', ')}`),
];

router.use(protect);

router.get(
  '/doctor/schedule/me',
  authorize('doctor'),
  appointmentController.getDoctorSchedule
);

router.get(
  '/doctor/:doctorId/schedule',
  authorize('admin', 'doctor', 'receptionist'),
  doctorIdParam,
  appointmentController.getDoctorSchedule
);

router.get(
  '/patient/:patientId/history',
  authorize('admin', 'doctor', 'receptionist', 'patient'),
  patientIdParam,
  appointmentController.getPatientHistory
);

router
  .route('/')
  .post(authorize('admin', 'doctor', 'receptionist', 'patient'), appointmentFieldsValidation, appointmentController.bookAppointment)
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), appointmentController.getAppointments);

router.patch(
  '/:id/cancel',
  authorize('admin', 'receptionist'),
  mongoIdParam,
  appointmentController.cancelAppointment
);

router.patch(
  '/:id/status',
  authorize('admin', 'receptionist'),
  statusValidation,
  appointmentController.updateStatus
);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), mongoIdParam, appointmentController.getAppointment)
  .put(authorize('admin', 'receptionist'), updateAppointmentValidation, appointmentController.updateAppointment);

module.exports = router;
