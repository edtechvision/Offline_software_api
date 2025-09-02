// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/student/student');
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });
// /api/courses
router.post('/student',upload.single("image"), ctrl.createStudent);
router.put('/student-update/:id',upload.single("image"), ctrl.updateStudent);
router.get('/students', ctrl.getStudents);
router.get('/students/:id', ctrl.getStudentById);
router.put('/students/:id/activate', ctrl.activateStudent);
router.put('/students/:id/deactivate', ctrl.deactivateStudent);



module.exports = router;
