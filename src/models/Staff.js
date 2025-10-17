const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
  {
    staffname: {
      type: String,
      required: true,
      trim: true,
    },
    staffcode: {
       type: String,
    unique: true,
    required: true
    },
    password: {
    type: String,
    required: true,
    minlength: 6
  },
  plainPassword: {
    type: String,
    required: true,
  },
    mobile_number: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+?[0-9]{10,15}$/, "Invalid mobile number"],
    },
      isBlocked: {
    type: Boolean,
    default: false
  }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", StaffSchema);
