const express = require("express");

const adminRoute = require("../routes/admin/adminRoutes");
const authRoute = require("../routes/authroute/authRoutes");
const centerRoute = require("../routes/centre/centerRoutes");
const admissionInchargeRoute = require("../routes/admissionIncharge/admissionInchargeRoutes");





const router = express.Router();

router.use("/api/v1", adminRoute);
router.use("/api/v1", authRoute);
router.use("/api/v1", centerRoute);
router.use("/api/v1", admissionInchargeRoute);



module.exports = router;
