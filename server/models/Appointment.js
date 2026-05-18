const mongoose = require('mongoose');

const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Appointment time must use HH:mm format'],
    },
    symptoms: {
      type: String,
      required: [true, 'Symptoms are required'],
      trim: true,
      maxlength: [1000, 'Symptoms cannot exceed 1000 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: statuses,
      default: 'pending',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ doctorId: 1, appointmentDate: 1, appointmentTime: 1 });

appointmentSchema.statics.statuses = statuses;

module.exports = mongoose.model('Appointment', appointmentSchema);
