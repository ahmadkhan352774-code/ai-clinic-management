const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Medical history title is required'],
      trim: true,
      maxlength: [120, 'Medical history title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Medical history description is required'],
      trim: true,
      maxlength: [2000, 'Medical history description cannot exceed 2000 characters'],
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [500, 'Diagnosis cannot exceed 500 characters'],
    },
    treatment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Treatment cannot exceed 1000 characters'],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      maxlength: [80, 'Patient name cannot exceed 80 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [130, 'Age cannot exceed 130'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female', 'other'],
      lowercase: true,
      trim: true,
    },
    contact: {
      type: String,
      required: [true, 'Contact is required'],
      trim: true,
      maxlength: [30, 'Contact cannot exceed 30 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    medicalHistory: {
      type: [medicalHistorySchema],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

module.exports = mongoose.model('Patient', patientSchema);
