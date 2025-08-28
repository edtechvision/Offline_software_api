// models/Course.js
const mongoose = require('mongoose');

const AdditionalCourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
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

module.exports = mongoose.model('AdditionalCourse', AdditionalCourseSchema);
