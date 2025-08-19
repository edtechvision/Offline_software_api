const express = require("express");

const centerRoute = require("../routes/centre/centerRoutes");
const admissionInchargeRoute = require("../routes/admissionIncharge/admissionInchargeRoutes");





const router = express.Router();

router.use("/api/v1", centerRoute);
router.use("/api/v1", admissionInchargeRoute);



module.exports = router;
