const express = require("express");
const router = express.Router();
const { markAttendance ,getAttendance,getStudentAttendanceSummary} = require("../../controllers/Attendance/Attendance");

// POST /api/attendance/mark
router.post("/attendance/mark", markAttendance);
router.get("/attendance", getAttendance);
router.get("/attendance/summary/:studentId", getStudentAttendanceSummary);

module.exports = router;
