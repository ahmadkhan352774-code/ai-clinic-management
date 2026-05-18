const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const validateRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join(', '), 400);
  }
};

const appointmentPopulate = [
  {
    path: 'patientId',
    select: 'name age gender contact address user',
    populate: { path: 'user', select: 'name email role' },
  },
  { path: 'doctorId', select: 'name email role' },
  { path: 'createdBy', select: 'name email role' },
];

const allowedAppointmentFields = [
  'patientId',
  'doctorId',
  'appointmentDate',
  'appointmentTime',
  'symptoms',
  'notes',
  'status',
];

const getAppointmentPayload = (body, allowedFields = allowedAppointmentFields) => {
  const payload = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  return payload;
};

const getPatientIdsForUser = async (userId) => {
  const patients = await Patient.find({ user: userId }).select('_id');
  return patients.map((patient) => patient._id);
};

const getScopedAppointmentQuery = async (user) => {
  if (['admin', 'receptionist'].includes(user.role)) {
    return {};
  }

  if (user.role === 'doctor') {
    return { doctorId: user._id };
  }

  const patientIds = await getPatientIdsForUser(user._id);
  return { patientId: { $in: patientIds } };
};

const canAccessAppointment = (user, appointment) => {
  if (['admin', 'receptionist'].includes(user.role)) {
    return true;
  }

  if (user.role === 'doctor') {
    return appointment.doctorId._id.toString() === user._id.toString();
  }

  const patientUser = appointment.patientId.user;
  const patientUserId = patientUser && (patientUser._id || patientUser);
  return user.role === 'patient' && patientUserId && patientUserId.toString() === user._id.toString();
};

const assertBookPermission = async (user, patientId) => {
  const patient = await Patient.findById(patientId);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  if (user.role === 'patient' && (!patient.user || patient.user.toString() !== user._id.toString())) {
    throw new AppError('You can only book appointments for your own patient profile', 403);
  }

  return patient;
};

const assertDoctor = async (doctorId) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });

  if (!doctor) {
    throw new AppError('Doctor not found or inactive', 404);
  }
};

exports.bookAppointment = asyncHandler(async (req, res) => {
  validateRequest(req);

  await assertBookPermission(req.user, req.body.patientId);
  await assertDoctor(req.body.doctorId);

  const appointment = await Appointment.create({
    ...getAppointmentPayload(req.body, allowedAppointmentFields.filter((field) => field !== 'status')),
    status: 'pending',
    createdBy: req.user._id,
  });

  const populatedAppointment = await appointment.populate(appointmentPopulate);

  res.status(201).json({
    success: true,
    appointment: populatedAppointment,
  });
});

exports.getAppointments = asyncHandler(async (req, res) => {
  const query = await getScopedAppointmentQuery(req.user);

  const appointments = await Appointment.find(query)
    .populate(appointmentPopulate)
    .sort({ appointmentDate: 1, appointmentTime: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

exports.getAppointment = asyncHandler(async (req, res) => {
  validateRequest(req);

  const appointment = await Appointment.findById(req.params.id).populate(appointmentPopulate);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (!canAccessAppointment(req.user, appointment)) {
    throw new AppError('You do not have permission to view this appointment', 403);
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

exports.updateAppointment = asyncHandler(async (req, res) => {
  validateRequest(req);

  if (req.body.patientId) {
    await assertBookPermission({ ...req.user.toObject(), role: 'receptionist' }, req.body.patientId);
  }

  if (req.body.doctorId) {
    await assertDoctor(req.body.doctorId);
  }

  const appointment = await Appointment.findByIdAndUpdate(req.params.id, getAppointmentPayload(req.body), {
    new: true,
    runValidators: true,
  }).populate(appointmentPopulate);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

exports.cancelAppointment = asyncHandler(async (req, res) => {
  validateRequest(req);

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled' },
    { new: true, runValidators: true }
  ).populate(appointmentPopulate);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  validateRequest(req);

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate(appointmentPopulate);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

exports.getDoctorSchedule = asyncHandler(async (req, res) => {
  validateRequest(req);

  const doctorId = req.params.doctorId || req.user._id;

  if (req.user.role === 'doctor' && doctorId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only view your own schedule', 403);
  }

  await assertDoctor(doctorId);

  const appointments = await Appointment.find({ doctorId })
    .populate(appointmentPopulate)
    .sort({ appointmentDate: 1, appointmentTime: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

exports.getPatientHistory = asyncHandler(async (req, res) => {
  validateRequest(req);

  const patient = await Patient.findById(req.params.patientId);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  if (req.user.role === 'patient' && (!patient.user || patient.user.toString() !== req.user._id.toString())) {
    throw new AppError('You can only view your own appointment history', 403);
  }

  const appointments = await Appointment.find({ patientId: patient._id })
    .populate(appointmentPopulate)
    .sort({ appointmentDate: -1, appointmentTime: -1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});
