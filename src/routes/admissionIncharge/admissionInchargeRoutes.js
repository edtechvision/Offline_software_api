const express = require("express");
const { createAdmissionIncharge } = require("../../controllers/AdmissionIncharge/admissionInchargeController");

const router = express.Router();

router.post("/admissionIncharge/create", createAdmissionIncharge);

module.exports = router;
