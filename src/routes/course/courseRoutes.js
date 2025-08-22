// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/course/courseController');

// /api/courses
router.post('/courses', ctrl.createCourse);
router.get('/courses', ctrl.getCourses);
router.get('/courses/:id', ctrl.getCourseById);
router.patch('/courses/:id', ctrl.updateCourse);
router.delete('/courses/:id', ctrl.deleteCourse);

module.exports = router;
