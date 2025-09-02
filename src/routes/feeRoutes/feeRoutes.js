// routes/feeRoutes.js
const express = require("express");
const router = express.Router();
const feeController = require("../../controllers/feeController/feeController");

router.post("/fees", feeController.createFee);
router.post("/fees/payment", feeController.addPayment);
router.get("/fees-by-student/:studentId", feeController.getStudentFees);
router.get("/fees/all-payments", feeController.getAllPayments);
router.post("/fees/revert-payment", feeController.revertPayment);

router.get("/fees/pending", feeController.getPendingFees);

module.exports = router;
