const Student = require("../../models/Student");
const Attendance = require("../../models/Attendance");

exports.markAttendance = async (req, res) => {
  try {
    const { qrCodeData, markedBy } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({
        success: false,
        message: "QR Code data is required",
      });
    }

    // ✅ Find student by QR code data
    const student = await Student.findOne({ registrationNo: qrCodeData });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // ✅ Check if already marked today
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    // ✅ Save attendance
    const attendance = new Attendance({
      studentId: student._id,
      registrationNo: student.registrationNo,
      status: "Present",
      markedBy: markedBy || "System",
    });

    const savedAttendance = await attendance.save();

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: savedAttendance,
    });
  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
