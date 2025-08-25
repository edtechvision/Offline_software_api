// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/course/courseController');

// /api/courses
router.post('/courses', ctrl.createCourse);
router.get('/courses', ctrl.getCourses);
router.get('/courses/:id', ctrl.getCourseById);
router.get('/courses/incharge', ctrl.getActiveCoursesForStaff);

router.put('/courses/:courseId', ctrl.updateCourse);

router.delete('/courses/:id', ctrl.deleteCourse);
router.post('/courses/:courseId/active', ctrl.toggleCourseActive);

module.exports = router;
