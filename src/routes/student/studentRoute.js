// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/student/student');

// /api/courses
router.post('/student', ctrl.createStudent);
router.get('/student/:id', ctrl.updateStudent);
router.get('/students', ctrl.getStudents);
router.get('/students/:id', ctrl.getStudentById);



module.exports = router;
