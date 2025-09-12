// models/Log.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "CREATE_STUDENT", "ADD_PAYMENT", "REVERT_PAYMENT"
  user: { type: String }, // Admin, incharge, etc.
  inchargeCode: { type: String },
  details: { type: Object }, // store request payload or important info
  status: { type: String, enum: ["SUCCESS", "FAILED"], default: "SUCCESS" },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);
