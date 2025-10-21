// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/student/student");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });
// /api/courses
// router.post('/student',upload.single("image"), ctrl.createStudent);
router.post(
  "/student",
  upload.fields([
    { name: "image", maxCount: 1 }, // student profile photo
    { name: "discountFile", maxCount: 1 }, // fee-related discount document
  ]),
  ctrl.createStudent
);
// router.put('/student-update/:id',upload.single("image"), ctrl.updateStudent);
router.put(
  "/student-update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "discountFile", maxCount: 1 },
  ]),
  ctrl.updateStudent
);

router.get("/students", ctrl.getStudents);
router.get("/students/:id", ctrl.getStudentById);
router.put("/students/:id/activate", ctrl.activateStudent);
router.put("/students/:id/deactivate", ctrl.deactivateStudent);
router.delete("/students/:id", ctrl.deleteStudent);
// ✅ Update ID card status (true/false)
router.patch("/students/:studentId/idcard", ctrl.updateIdCardStatus);

module.exports = router;
