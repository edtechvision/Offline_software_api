const express = require("express");
const { createAdmissionIncharge,getAdmissionIncharges } = require("../../controllers/AdmissionIncharge/admissionInchargeController");

const router = express.Router();

router.post("/admissionIncharge/create", createAdmissionIncharge);
router.post("/admissionIncharge/get", getAdmissionIncharges);

module.exports = router;
