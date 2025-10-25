const express = require("express");
const router = express.Router();
const { markAttendance ,getAttendance} = require("../../controllers/Attendance/Attendance");

// POST /api/attendance/mark
router.post("/attendance/mark", markAttendance);
router.get("/attendance", getAttendance);

module.exports = router;
