const express = require("express");
const router = express.Router();
const staffController = require("../../controllers/staffController/StaffController");

// Routes
router.post("/staff/register", staffController.createStaff);
// router.post("/staff/login", staffController.loginStaff);
router.get("/staff", staffController.getAllStaff);
router.get("/staff/:id", staffController.getStaffById);
router.put("/staff/:id", staffController.updateStaff);
router.delete("/staff/:id", staffController.deleteStaff);
router.patch("/staff/:id/toggle-block", staffController.toggleBlockStaff);

module.exports = router;
