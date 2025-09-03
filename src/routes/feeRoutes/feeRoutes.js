// routes/feeRoutes.js
const express = require("express");
const router = express.Router();
const feeController = require("../../controllers/feeController/feeController");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;

router.post("/fees", feeController.createFee);
// router.post("/fees/payment", feeController.addPayment);
router.post("/fees/collect-payment", upload.single("discountFile"), feeController.addPayment);

router.get("/fees-by-student/:studentId", feeController.getStudentFees);
router.get("/fees/all-payments", feeController.getAllPayments);
router.post("/fees/revert-payment", feeController.revertPayment);

router.get("/fees/pending", feeController.getPendingFees);
router.get("/students-collect-fees", feeController.getCollectFeesStudents);


module.exports = router;
