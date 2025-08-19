const express = require("express");
const { createAdmissionIncharge } = require("../../controllers/AdmissionIncharge/admissionInchargeController");

const router = express.Router();

router.post("/create", createAdmissionIncharge);

module.exports = router;
