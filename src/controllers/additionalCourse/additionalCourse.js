// controllers/courseController.js
const AdditionalCourse = require('../../models/AdditionalCourse');

// Create
exports.createAdditionalCourse = async (req, res) => {
  try {
    const { name, serialNumber } = req.body;
    const course = await AdditionalCourse.create({ name, serialNumber });
    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'serialNumber must be unique' });
    }
    res.status(400).json({ message: err.message });
  }
};

// Read all (with basic pagination & sorting)
exports.getAdditionalCourse = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const sort = req.query.sort || 'serialNumber'; // e.g. ?sort=-createdAt

    const [items, total] = await Promise.all([
      AdditionalCourse.find().sort(sort).skip((page - 1) * limit).limit(limit),
      AdditionalCourse.countDocuments(),
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

exports.getAdditionalCourseByIncharge = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const sort = req.query.sort || 'serialNumber'; // e.g. ?sort=-createdAt


    const filter = {  isActive: true };

    const [items, total] = await Promise.all([
      AdditionalCourse.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      AdditionalCourse.countDocuments(filter),
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
exports.getAdditionalCourseById = async (req, res) => {
  try {
    const course = await AdditionalCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
};

// Update

// Update course
exports.updateAdditionalCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // name, fee, emiFee, serialNumber, isActive etc.

    const course = await AdditionalCourse.findByIdAndUpdate(
      id,
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
exports.deleteAdditionalCourse = async (req, res) => {
  try {
    const course = await AdditionalCourse.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Additional Course deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
};


// Toggle Course active/inactive
exports.toggleCourseActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body; // true or false

    const course = await AdditionalCourse.findByIdAndUpdate(
      id,
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