const express = require("express");

const adminRoute = require("../routes/admin/adminRoutes");
const authRoute = require("../routes/authroute/authRoutes");
const centerRoute = require("../routes/centre/centerRoutes");
const admissionInchargeRoute = require("../routes/admissionIncharge/admissionInchargeRoutes");
const batchRoute = require("../routes/batch/batchRoutes");
const courseRoute = require("../routes/course/courseRoutes");

const studentRoute = require("../routes/student/studentRoute");
const additionalCourseRoute = require("../routes/additionalCourse/additionalCourse");
const feesDiscountRoute = require("../routes/feesDiscount/feesDiscountRoutes");
const feesRoute = require("../routes/feeRoutes/feeRoutes");
const dashboardRoute = require("../routes/dashboard/dashboard.routes");
const expenseRoute = require("../routes/expenseRoutes/expenseRoutes");

const router = express.Router();

router.use("/api/v1", adminRoute);
router.use("/api/v1", authRoute);
router.use("/api/v1", centerRoute);
router.use("/api/v1", admissionInchargeRoute);
router.use("/api/v1", studentRoute);
router.use("/api/v1", batchRoute);
router.use("/api/v1", courseRoute);
router.use("/api/v1", additionalCourseRoute);
router.use("/api/v1", feesDiscountRoute);
router.use("/api/v1", feesRoute);
router.use("/api/v1", dashboardRoute);
router.use("/api/v1", expenseRoute);

module.exports = router;
