const express = require("express");
const { createAdmissionIncharge,getAdmissionIncharges,checkAdmissionIncharge } = require("../../controllers/AdmissionIncharge/admissionInchargeController");

const router = express.Router();

router.post("/admissionIncharge/create", createAdmissionIncharge);
router.get("/admissionIncharge/get", getAdmissionIncharges);
router.post("/check-admissionIncharge", checkAdmissionIncharge);

module.exports = router;
