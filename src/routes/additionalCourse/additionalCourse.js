// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/additionalCourse/additionalCourse');

// /api/courses
router.post('/additional-courses', ctrl.createAdditionalCourse);
router.get('/additional-courses', ctrl.getAdditionalCourse);
router.get('/additional-courses/:id', ctrl.getAdditionalCourseById);
router.get('/additional-courses-incharge', ctrl.getAdditionalCourseByIncharge);

router.put('/additional-courses-byId/:id', ctrl.updateAdditionalCourse);

router.delete('/additional-courses/:id', ctrl.deleteAdditionalCourse);
router.post('/additional-courses/:courseId/active', ctrl.toggleCourseActive);

module.exports = router;
