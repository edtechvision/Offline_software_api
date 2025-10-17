const Student = require("../../models/Student");
const Attendance = require("../../models/Attendance");
const Staff = require("../../models/Staff");

exports.markAttendance = async (req, res) => {
  try {
    const { qrCodeData, staffId } = req.body;

    // Validate input
    if (!qrCodeData || !staffId) {
      return res.status(400).json({
        success: false,
        message: "QR Code data and Staff ID are required",
      });
    }

    // ✅ Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (staff.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Staff account is blocked. Cannot mark attendance.",
      });
    }

    // ✅ Find student by QR code
    const student = await Student.findOne({ registrationNo: qrCodeData });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // ✅ Define date range for today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // ✅ Check if attendance already marked
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

    // ✅ Save attendance with staff ID reference
    const attendance = new Attendance({
      studentId: student._id,
      registrationNo: student.registrationNo,
      markedBy: staff._id, // 🔥 Save staff ID
    });

    const savedAttendance = await attendance.save();

    // Populate staff and student data in response
    const populatedAttendance = await Attendance.findById(savedAttendance._id)
      .populate("studentId", "name registrationNo")
      .populate("markedBy", "staffname staffcode");

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: populatedAttendance,
    });
  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


exports.getAttendance = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      startDate,
      endDate,
      sortBy = "date",
      order = "desc",
    } = req.query;

    // Convert to integers
    page = parseInt(page);
    limit = parseInt(limit);

    // ✅ Base query object
    const query = {};

    // ✅ Date range filter (optional)
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // ✅ Search across Student or Staff fields
    if (search.trim() !== "") {
      // find student IDs or staff IDs matching the search term
      const students = await Student.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { registrationNo: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const staffs = await Staff.find({
        $or: [
          { staffname: { $regex: search, $options: "i" } },
          { staffcode: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const studentIds = students.map((s) => s._id);
      const staffIds = staffs.map((s) => s._id);

      query.$or = [
        { studentId: { $in: studentIds } },
        { markedBy: { $in: staffIds } },
      ];
    }

    // ✅ Pagination + sorting
    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    // ✅ Fetch attendance with population
    const [attendances, total] = await Promise.all([
      Attendance.find(query)
        .populate("studentId", "name registrationNo")
        .populate("markedBy", "staffname staffcode")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query),
    ]);

    // ✅ Response
    res.status(200).json({
      success: true,
      totalRecords: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      results: attendances,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};