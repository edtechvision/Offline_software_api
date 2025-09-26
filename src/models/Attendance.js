const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    registrationNo: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["Present", "Absent"], default: "Present" },
    markedBy: { type: String }, // Incharge/Admin ID (optional)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
