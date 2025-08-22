const mongoose = require('mongoose');

const StudentaddressSchema = new mongoose.Schema({
  fullAddress: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true }
});

const StudentAddress = mongoose.model('StudentAddress', StudentaddressSchema);

module.exports = StudentAddress;
