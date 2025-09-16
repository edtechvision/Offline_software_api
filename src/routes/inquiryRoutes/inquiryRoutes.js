const express = require("express");
const router = express.Router();
const inquiryController = require("../../controllers/inquiryController/inquiryController");

router.post("/inquiries", inquiryController.createInquiry);
router.get("/inquiries", inquiryController.getInquiries);
router.get("/inquiries/:id", inquiryController.getInquiryById);
router.put("/:id", inquiryController.updateInquiry);
router.delete("/inquiries/:id", inquiryController.deleteInquiry);

module.exports = router;
