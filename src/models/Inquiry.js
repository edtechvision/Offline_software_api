const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  enquiry_date: {
    type: Date,
    default: Date.now,
  },
  center: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Inquiry", inquirySchema);
