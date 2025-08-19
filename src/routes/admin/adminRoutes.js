
const express = require("express");
const { signupAdmin } = require("../../controllers/admin/adminController");

const router = express.Router();

router.post("/signup", signupAdmin);

module.exports = router;
