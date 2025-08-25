// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    fee: {
      type: Number,
      required: true,
      min: [0, 'Fee cannot be negative'],
    },
    emiFee: {
      type: Number,
      required: true,
      min: [0, 'EMI fee cannot be negative'],
    
    },
    serialNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },
      isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', CourseSchema);
