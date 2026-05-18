const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalPatients = await Patient.countDocuments();
  const totalDoctors = await User.countDocuments({ role: 'doctor' });
  const totalAppointments = await Appointment.countDocuments();
  const totalPrescriptions = await Prescription.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
    },
  });
});

exports.getRecentUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: users,
  });
});
