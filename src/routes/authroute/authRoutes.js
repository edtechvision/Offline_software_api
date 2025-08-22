const express = require("express");
const { loginAdmin,loginIncharge } = require("../../controllers/AuthController/authController");
const router = express.Router();

// router.post("/login", login);
// Admin login
router.post('/admin/login', loginAdmin);

// Incharge login
router.post('/center/login', loginIncharge);

module.exports = router;
