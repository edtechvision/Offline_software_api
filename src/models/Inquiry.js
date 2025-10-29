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
  notes: {
    type: String, // or [String] if multiple notes
    default: "",  // optional default value
  },
  // ✅ New fields
  status: {
    type: String,
    enum: ["new", "contacted", "follow-up", "converted"], // predefined statuses
    default: "new", // default when created
  },
  followUpDate: {
    type: Date,
    default: null, // optional, can be set later
  },
});

module.exports = mongoose.model("Inquiry", inquirySchema);
