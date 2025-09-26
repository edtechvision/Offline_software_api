const express = require("express");
const router = express.Router();
const { markAttendance } = require("../../controllers/Attendance/Attendance");

// POST /api/attendance/mark
router.post("/attendance/mark", markAttendance);

module.exports = router;
