const Student = require("../../models/Student");
const Attendance = require("../../models/Attendance");
const Staff = require("../../models/Staff");
const Fee = require("../../models/Fee");
const Holiday = require("../../models/Holiday");

// exports.markAttendance = async (req, res) => {
//   try {
//     const { qrCodeData, staffId } = req.body;

//     // Validate input
//     if (!qrCodeData || !staffId) {
//       return res.status(400).json({
//         success: false,
//         message: "QR Code data and Staff ID are required",
//       });
//     }

//     // ✅ Check if staff exists
//     const staff = await Staff.findById(staffId);
//     if (!staff) {
//       return res.status(404).json({
//         success: false,
//         message: "Staff not found",
//       });
//     }

//     if (staff.isBlocked) {
//       return res.status(403).json({
//         success: false,
//         message: "Staff account is blocked. Cannot mark attendance.",
//       });
//     }

//     // ✅ Find student by QR code
//     const student = await Student.findOne({ registrationNo: qrCodeData });
//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     // ✅ Define date range for today
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     // ✅ Check if attendance already marked
//     const existingAttendance = await Attendance.findOne({
//       studentId: student._id,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });

//     if (existingAttendance) {
//       return res.status(400).json({
//         success: false,
//         message: "Attendance already marked for today",
//       });
//     }

//     // ✅ Save attendance with staff ID reference
//     const attendance = new Attendance({
//       studentId: student._id,
//       registrationNo: student.registrationNo,
//       markedBy: staff._id, // 🔥 Save staff ID
//     });

//     const savedAttendance = await attendance.save();

//     // Populate staff and student data in response
//     const populatedAttendance = await Attendance.findById(savedAttendance._id)
//       .populate("studentId", "name registrationNo")
//       .populate("markedBy", "staffname staffcode");

//     res.status(201).json({
//       success: true,
//       message: "Attendance marked successfully",
//       data: populatedAttendance,
//     });
//   } catch (error) {
//     console.error("Attendance Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

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
      markedBy: staff._id,
    });

    const savedAttendance = await attendance.save();

    // ✅ Populate staff and student data
    const populatedAttendance = await Attendance.findById(savedAttendance._id)
      .populate("studentId", "studentName registrationNo")
      .populate("markedBy", "staffname staffcode");

    // ✅ Fetch student's pending fees
    const fee = await Fee.findOne({
      studentId: student._id,
      pendingAmount: { $gt: 0 },
    })
      .populate("courseId", "name")
      .populate("studentId", "studentName registrationNo mobileNumber email");

    let pendingFeesData = null;
    if (fee) {
      pendingFeesData = {
        studentId: fee.studentId?._id,
        studentName: fee.studentId?.studentName,
        studentEmail: fee.studentId?.email,
        registrationNo: fee.studentId?.registrationNo,
        contactNumber: fee.studentId?.mobileNumber,
        courseName: fee.courseId?.name,
        courseFee: fee.totalFee,
        totalReceivedFees: fee.paidAmount,
        pendingFees: fee.pendingAmount,
        nextDueDate: fee.nextPaymentDueDate,
      };
    }

    // ✅ Final response
    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        attendance: populatedAttendance,
        pendingFees: pendingFeesData,
      },
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

    page = parseInt(page);
    limit = parseInt(limit);

    // ✅ Base query
    const query = {};

    // ✅ Date range filter (default to today if not provided)
    const today = new Date();
    const defaultStart = new Date(today.setHours(0, 0, 0, 0));
    const defaultEnd = new Date(today.setHours(23, 59, 59, 999));

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    } else {
      // default to today’s attendance
      query.date = { $gte: defaultStart, $lte: defaultEnd };
    }

    // ✅ Search filter (student/staff)
    if (search.trim() !== "") {
      const students = await Student.find({
        $or: [
          { studentName: { $regex: search, $options: "i" } },
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

    // ✅ Pagination & sorting
    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    // ✅ Fetch paginated attendance data
    const [attendances, total] = await Promise.all([
      Attendance.find(query)
        .populate("studentId", "studentName registrationNo")
        .populate("markedBy", "staffname staffcode")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query),
    ]);

    // ✅ Calculate attendance stats for the same period
    const totalPresent = await Attendance.countDocuments(query);
    const totalStudents = await Student.countDocuments();
    const totalAbsent = totalStudents - totalPresent;

    const totalScanned = totalPresent; // same as totalPresent

    // ✅ Final Response
    res.status(200).json({
      success: true,
      message: "Attendance list fetched successfully",
      totalRecords: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalScanned,
        totalPresent,
        totalAbsent,
      },
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

// exports.getAttendance = async (req, res) => {
//   try {
//     let {
//       page = 1,
//       limit = 10,
//       search = "",
//       startDate,
//       endDate,
//       sortBy = "date",
//       order = "desc",
//     } = req.query;

//     // Convert to integers
//     page = parseInt(page);
//     limit = parseInt(limit);

//     // ✅ Base query object
//     const query = {};

//     // ✅ Date range filter (optional)
//     if (startDate || endDate) {
//       query.date = {};
//       if (startDate) query.date.$gte = new Date(startDate);
//       if (endDate) query.date.$lte = new Date(endDate);
//     }

//     // ✅ Search across Student or Staff fields
//     if (search.trim() !== "") {
//       // find student IDs or staff IDs matching the search term
//       const students = await Student.find({
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { registrationNo: { $regex: search, $options: "i" } },
//         ],
//       }).select("_id");

//       const staffs = await Staff.find({
//         $or: [
//           { staffname: { $regex: search, $options: "i" } },
//           { staffcode: { $regex: search, $options: "i" } },
//         ],
//       }).select("_id");

//       const studentIds = students.map((s) => s._id);
//       const staffIds = staffs.map((s) => s._id);

//       query.$or = [
//         { studentId: { $in: studentIds } },
//         { markedBy: { $in: staffIds } },
//       ];
//     }

//     // ✅ Pagination + sorting
//     const skip = (page - 1) * limit;
//     const sortOrder = order === "asc" ? 1 : -1;

//     // ✅ Fetch attendance with population
//     const [attendances, total] = await Promise.all([
//       Attendance.find(query)
//         .populate("studentId", "studentName registrationNo")
//         .populate("markedBy", "staffname staffcode")
//         .sort({ [sortBy]: sortOrder })
//         .skip(skip)
//         .limit(limit),
//       Attendance.countDocuments(query),
//     ]);

//     // ✅ Response
//     res.status(200).json({
//       success: true,
//       totalRecords: total,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       results: attendances,
//     });
//   } catch (error) {
//     console.error("Get Attendance Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    // ✅ Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // ✅ Get all attendances of this student for the current year
    const attendances = await Attendance.find({
      studentId,
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    }).sort({ date: 1 });

    // ✅ Get all holidays in this year
    const holidays = await Holiday.find({
      date: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    });

    // Convert holiday dates to set for faster lookup
    const holidayDates = new Set(holidays.map((h) => h.date.toDateString()));

    // ✅ Create helper to check if Sunday
    const isSunday = (date) => new Date(date).getDay() === 0;

    // ✅ Generate list of all days from Jan 1 to today
    const allDays = [];
    let day = new Date(`${currentYear}-01-01`);
    const today = new Date();
    while (day <= today) {
      // Exclude Sundays
      if (!isSunday(day)) {
        allDays.push(new Date(day));
      }
      day.setDate(day.getDate() + 1);
    }

    // ✅ Prepare sets for attended days
    const presentDates = new Set(attendances.map((a) => a.date.toDateString()));

    // ✅ Calculate totals
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHolidays = 0;

    for (let d of allDays) {
      const dateStr = d.toDateString();

      if (holidayDates.has(dateStr)) {
        totalHolidays++;
      } else if (presentDates.has(dateStr)) {
        totalPresent++;
      } else {
        totalAbsent++;
      }
    }

    // ✅ Monthly breakdown
    const monthlyAttendance = {};

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(currentYear, month).toLocaleString("default", {
        month: "long",
      });

      const monthDays = allDays.filter((d) => d.getMonth() === month);
      const monthHolidays = monthDays.filter((d) =>
        holidayDates.has(d.toDateString())
      ).length;
      const monthPresents = monthDays.filter((d) =>
        presentDates.has(d.toDateString())
      ).length;
      const monthAbsents = monthDays.length - (monthPresents + monthHolidays);

      monthlyAttendance[monthName] = {
        totalDays: monthDays.length,
        present: monthPresents,
        absent: monthAbsents,
        holidays: monthHolidays,
      };
    }

    // ✅ Final response
    res.status(200).json({
      success: true,
      message: "Attendance summary fetched successfully",
      data: {
        student: {
          id: student._id,
          name: student.studentName,
          registrationNo: student.registrationNo,
        },
        totalPresent,
        totalAbsent,
        totalHolidays,
        monthlyAttendance,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};