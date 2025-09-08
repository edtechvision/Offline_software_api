// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/dashboard/dashboard");

// /api/courses
router.get("/get-dashboard", ctrl.getDashboardStats);

module.exports = router;
