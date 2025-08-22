const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const centerSchema = new mongoose.Schema({
  centerCode: {
    type: String,
    unique: true,
    required: true
  },
  centerName: {
    type: String,
    required: true,
    trim: true
  },
  centerHeadName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  centerHeadMobileNo: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  fullAddress: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  plainPassword: {
    type: String,
    required: true,
  }
}, { timestamps: true });


// Generate random CenterCode before saving
centerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const Center = mongoose.model('Center', centerSchema);

module.exports = Center;
