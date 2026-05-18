const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const diagnosisValidation = [
  body('symptoms')
    .trim()
    .notEmpty()
    .withMessage('Symptoms are required')
    .isLength({ min: 3, max: 2000 })
    .withMessage('Symptoms must be between 3 and 2000 characters'),
  body('age').isInt({ min: 0, max: 130 }).withMessage('Age must be between 0 and 130'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('medicalHistory')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Medical history cannot exceed 3000 characters'),
];

router.use(protect);
router.use(authorize('admin', 'doctor'));

router
  .route('/diagnosis')
  .get((_req, res) => {
    res.status(405).json({
      success: false,
      message: 'Use POST /api/ai/diagnosis to generate an AI diagnosis',
    });
  })
  .post(diagnosisValidation, aiController.generateDiagnosis);

module.exports = router;
