const PDFDocument = require('pdfkit');
const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const validateRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join(', '), 400);
  }
};

const prescriptionPopulate = [
  {
    path: 'patientId',
    select: 'name age gender contact address user',
    populate: { path: 'user', select: 'name email role' },
  },
  { path: 'doctorId', select: 'name email role phone' },
  { path: 'appointmentId', select: 'appointmentDate appointmentTime symptoms status' },
];

const allowedPrescriptionFields = [
  'patientId',
  'doctorId',
  'appointmentId',
  'medicines',
  'diagnosis',
  'notes',
  'instructions',
];

const getPrescriptionPayload = (body) => {
  const payload = {};

  allowedPrescriptionFields.forEach((field) => {
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

const getScopedPrescriptionQuery = async (user) => {
  if (['admin', 'receptionist'].includes(user.role)) {
    return {};
  }

  if (user.role === 'doctor') {
    return { doctorId: user._id };
  }

  const patientIds = await getPatientIdsForUser(user._id);
  return { patientId: { $in: patientIds } };
};

const canAccessPrescription = (user, prescription) => {
  if (['admin', 'receptionist'].includes(user.role)) {
    return true;
  }

  if (user.role === 'doctor') {
    return prescription.doctorId._id.toString() === user._id.toString();
  }

  const patientUser = prescription.patientId.user;
  const patientUserId = patientUser && (patientUser._id || patientUser);
  return user.role === 'patient' && patientUserId && patientUserId.toString() === user._id.toString();
};

const findPopulatedPrescription = (id) => Prescription.findById(id).populate(prescriptionPopulate);

const assertPatient = async (patientId) => {
  const patient = await Patient.findById(patientId);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  return patient;
};

const assertDoctor = async (doctorId) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });

  if (!doctor) {
    throw new AppError('Doctor not found or inactive', 404);
  }

  return doctor;
};

const assertAppointment = async ({ appointmentId, patientId, doctorId }) => {
  if (!appointmentId) {
    return;
  }

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.patientId.toString() !== patientId.toString()) {
    throw new AppError('Appointment does not belong to this patient', 400);
  }

  if (appointment.doctorId.toString() !== doctorId.toString()) {
    throw new AppError('Appointment does not belong to this doctor', 400);
  }
};

const assertDoctorCanWrite = (user, doctorId) => {
  if (user.role === 'doctor' && doctorId.toString() !== user._id.toString()) {
    throw new AppError('Doctors can only manage their own prescriptions', 403);
  }
};

const writeLine = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value || 'N/A');
};

const writeSectionTitle = (doc, title) => {
  doc.moveDown(1);
  doc.fontSize(14).font('Helvetica-Bold').text(title);
  doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).stroke();
  doc.moveDown(0.7);
  doc.fontSize(10).font('Helvetica');
};

exports.createPrescription = asyncHandler(async (req, res) => {
  validateRequest(req);

  await assertPatient(req.body.patientId);
  await assertDoctor(req.body.doctorId);
  await assertAppointment(req.body);
  assertDoctorCanWrite(req.user, req.body.doctorId);

  const prescription = await Prescription.create(getPrescriptionPayload(req.body));
  const populatedPrescription = await prescription.populate(prescriptionPopulate);

  res.status(201).json({
    success: true,
    prescription: populatedPrescription,
  });
});

exports.getPrescriptions = asyncHandler(async (req, res) => {
  const query = await getScopedPrescriptionQuery(req.user);

  const prescriptions = await Prescription.find(query).populate(prescriptionPopulate).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    prescriptions,
  });
});

exports.getPrescription = asyncHandler(async (req, res) => {
  validateRequest(req);

  const prescription = await findPopulatedPrescription(req.params.id);

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  if (!canAccessPrescription(req.user, prescription)) {
    throw new AppError('You do not have permission to view this prescription', 403);
  }

  res.status(200).json({
    success: true,
    prescription,
  });
});

exports.updatePrescription = asyncHandler(async (req, res) => {
  validateRequest(req);

  const existingPrescription = await Prescription.findById(req.params.id);

  if (!existingPrescription) {
    throw new AppError('Prescription not found', 404);
  }

  const payload = {
    ...existingPrescription.toObject(),
    ...getPrescriptionPayload(req.body),
  };

  await assertPatient(payload.patientId);
  await assertDoctor(payload.doctorId);
  await assertAppointment(payload);
  assertDoctorCanWrite(req.user, payload.doctorId);

  const prescription = await Prescription.findByIdAndUpdate(req.params.id, getPrescriptionPayload(req.body), {
    new: true,
    runValidators: true,
  }).populate(prescriptionPopulate);

  res.status(200).json({
    success: true,
    prescription,
  });
});

exports.deletePrescription = asyncHandler(async (req, res) => {
  validateRequest(req);

  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  assertDoctorCanWrite(req.user, prescription.doctorId);

  await prescription.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Prescription deleted successfully',
  });
});

exports.getPatientHistory = asyncHandler(async (req, res) => {
  validateRequest(req);

  const patient = await Patient.findById(req.params.patientId);

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  if (req.user.role === 'patient' && (!patient.user || patient.user.toString() !== req.user._id.toString())) {
    throw new AppError('You can only view your own prescription history', 403);
  }

  const query = req.user.role === 'doctor' ? { patientId: patient._id, doctorId: req.user._id } : { patientId: patient._id };

  const prescriptions = await Prescription.find(query)
    .populate(prescriptionPopulate)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    prescriptions,
  });
});

exports.getDoctorPrescriptions = asyncHandler(async (req, res) => {
  validateRequest(req);

  const doctorId = req.params.doctorId || req.user._id;

  if (req.user.role === 'doctor' && doctorId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only view your own prescription list', 403);
  }

  await assertDoctor(doctorId);

  const prescriptions = await Prescription.find({ doctorId })
    .populate(prescriptionPopulate)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    prescriptions,
  });
});

exports.downloadPrescriptionPdf = asyncHandler(async (req, res) => {
  validateRequest(req);

  const prescription = await findPopulatedPrescription(req.params.id);

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  if (!canAccessPrescription(req.user, prescription)) {
    throw new AppError('You do not have permission to download this prescription', 403);
  }

  const doc = new PDFDocument({ margin: 50 });
  const filename = `prescription-${prescription._id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  doc.fontSize(20).font('Helvetica-Bold').text(process.env.CLINIC_NAME || 'AI Clinic Management', {
    align: 'center',
  });
  doc.fontSize(10).font('Helvetica').text('Prescription', { align: 'center' });
  doc.moveDown(1);

  writeSectionTitle(doc, 'Patient Information');
  writeLine(doc, 'Name', prescription.patientId.name);
  writeLine(doc, 'Age', prescription.patientId.age);
  writeLine(doc, 'Gender', prescription.patientId.gender);
  writeLine(doc, 'Contact', prescription.patientId.contact);
  writeLine(doc, 'Address', prescription.patientId.address);

  writeSectionTitle(doc, 'Doctor Information');
  writeLine(doc, 'Name', prescription.doctorId.name);
  writeLine(doc, 'Email', prescription.doctorId.email);
  writeLine(doc, 'Phone', prescription.doctorId.phone);

  writeSectionTitle(doc, 'Prescription Details');
  writeLine(doc, 'Created Date', new Date(prescription.createdAt).toLocaleDateString());
  writeLine(doc, 'Diagnosis', prescription.diagnosis);
  writeLine(doc, 'Notes', prescription.notes);
  writeLine(doc, 'Instructions', prescription.instructions);

  writeSectionTitle(doc, 'Medicines');
  prescription.medicines.forEach((medicine, index) => {
    doc.font('Helvetica-Bold').text(`${index + 1}. ${medicine.medicineName}`);
    doc.font('Helvetica').text(`Dosage: ${medicine.dosage}`);
    doc.text(`Timing: ${medicine.timing}`);
    doc.text(`Duration: ${medicine.duration}`);
    doc.moveDown(0.5);
  });

  doc.moveDown(2);
  doc.fontSize(9).text('Generated by AI Clinic Management System', { align: 'center' });
  doc.end();
});
