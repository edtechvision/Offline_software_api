const mongoose = require("mongoose");

const AdmissionInchargeSchema = new mongoose.Schema(
  {
    incharge_name: {
      type: String,
      required: true,
      trim: true,
    },
    incharge_code: {
       type: String,
    unique: true,
    required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile_number: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+?[0-9]{10,15}$/, "Invalid mobile number"],
    },
    aadhaar_number: {
      type: String,
      required: true,
      unique: true,
      match: [/^[0-9]{12}$/, "Invalid Aadhaar number"],
    },
    full_address: {
      type: String,
      required: true,
      trim: true,
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center", // reference to Center model
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdmissionIncharge", AdmissionInchargeSchema);
