const express = require("express");
const { createAdmissionIncharge,getAdmissionIncharges,checkAdmissionIncharge,toggleAdmissionIncharge ,updateAdmissionIncharge,deleteAdmissionIncharge} = require("../../controllers/AdmissionIncharge/admissionInchargeController");

const router = express.Router();

router.post("/admissionIncharge/create", createAdmissionIncharge);
router.get("/admissionIncharge/get", getAdmissionIncharges);
router.post("/check-admissionIncharge", checkAdmissionIncharge);
router.post('/admissionIncharge/block/:id', toggleAdmissionIncharge);
router.put('/admissionIncharge/:inchargeId', updateAdmissionIncharge);

router.delete("/admissionIncharge/:id", deleteAdmissionIncharge);



module.exports = router;
