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
exports.updateCourse = async (req, res) => {
  try {
    const updates = (({ name, fee, emiFee, serialNumber }) => ({ name, fee, emiFee, serialNumber }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
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
