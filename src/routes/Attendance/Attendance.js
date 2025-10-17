const express = require("express");
const router = express.Router();
const { markAttendance } = require("../../controllers/Attendance/Attendance");

// POST /api/attendance/mark
router.post("/attendance/mark", markAttendance);
router.get("/attendance", markAttendance);

module.exports = router;
