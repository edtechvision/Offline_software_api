// controllers/courseController.js
const Course = require('../../models/Course');

// Create
exports.createCourse = async (req, res) => {
  try {
    const { name, fee, emiFee, serialNumber } = req.body;
    const course = await Course.create({ name, fee, emiFee, serialNumber });
    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'serialNumber must be unique' });
    }
    res.status(400).json({ message: err.message });
  }
};

// Read all (with basic pagination & sorting)
exports.getCourses = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const sort = req.query.sort || 'serialNumber'; // e.g. ?sort=-createdAt

    const [items, total] = await Promise.all([
      Course.find().sort(sort).skip((page - 1) * limit).limit(limit),
      Course.countDocuments(),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get only active courses (staff)
exports.getActiveCoursesForStaff = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const sort = req.query.sort || 'serialNumber'; // e.g. ?sort=-createdAt

    const query = { isActive: true };

    const [items, total] = await Promise.all([
      Course.find(query).sort(sort).skip((page - 1) * limit).limit(limit),
      Course.countDocuments(query),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read one
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
};

// Update

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body; // name, fee, emiFee, serialNumber, isActive etc.

    const course = await Course.findByIdAndUpdate(
      courseId,
      updates,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'serialNumber must be unique' });
    }
    res.status(400).json({ message: err.message });
  }
};

// Delete
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
};


// Toggle Course active/inactive
exports.toggleCourseActive = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { active } = req.body; // true or false

    const course = await Course.findByIdAndUpdate(
      courseId,
      { isActive: active },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: `Course ${active ? "activated" : "deactivated"} successfully`,
      course
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};