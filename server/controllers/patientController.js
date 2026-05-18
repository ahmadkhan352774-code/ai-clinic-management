const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const validateRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join(', '), 400);
  }
};

const allowedPatientFields = ['name', 'age', 'gender', 'contact', 'address', 'medicalHistory', 'user'];

const getPatientPayload = (body, currentUserId) => {
  const payload = {};

  allowedPatientFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (Array.isArray(payload.medicalHistory)) {
    payload.medicalHistory = payload.medicalHistory.map((entry) => ({
      ...entry,
      recordedBy: entry.recordedBy || currentUserId,
    }));
  }

  return payload;
};

const canViewPatient = (user, patient) => {
  if (['admin', 'doctor', 'receptionist'].includes(user.role)) {
    return true;
  }

  return user.role === 'patient' && patient.user && patient.user.toString() === user._id.toString();
};

exports.createPatient = asyncHandler(async (req, res) => {
  validateRequest(req);

  const patient = await Patient.create({
    ...getPatientPayload(req.body, req.user._id),
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    patient,
  });
});

exports.getPatients = asyncHandler(async (req, res) => {
  const query = req.user.role === 'patient' ? { user: req.user._id } : {};

  const patients = await Patient.find(query)
    .populate('user', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('medicalHistory.recordedBy', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: patients.length,
    patients,
  });
});

exports.getPatient = asyncHandler(async (req, res) => {
  validateRequest(req);

  const patient = await Patient.findById(req.params.id)
    .populate('user', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('medicalHistory.recordedBy', 'name email role');

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  if (!canViewPatient(req.user, patient)) {
    throw new AppError('You do not have permission to view this patient', 403);
  }

  res.status(200).json({
    success: true,
    patient,
  });
});

exports.updatePatient = asyncHandler(async (req, res) => {
  validateRequest(req);

  const patient = await Patient.findByIdAndUpdate(req.params.id, getPatientPayload(req.body, req.user._id), {
    new: true,
    runValidators: true,
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    patient,
  });
});

exports.deletePatient = asyncHandler(async (req, res) => {
  validateRequest(req);

  const patient = await Patient.findByIdAndDelete(req.params.id);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Patient deleted successfully',
  });
});
