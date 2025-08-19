const express = require("express");
const { login } = require("../../controllers/AuthController/authController");

const router = express.Router();

router.post("/login", login);

module.exports = router;
