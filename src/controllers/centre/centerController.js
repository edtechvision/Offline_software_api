const Center = require("../../models/Center");

exports.createCenter = async (req, res) => {
  try {
    const {
      centerName,
      centerHeadName,
      email,
      centerHeadMobileNo,
      fullAddress,
      state,
      district,
      password
    } = req.body;

    // Check if email already exists
    const existingCenter = await Center.findOne({ email });
    if (existingCenter) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new center
    const newCenter = new Center({
        centerCode: 'TB' + Math.floor(10000 + Math.random() * 90000),

      centerName,
      centerHeadName,
      email,
      centerHeadMobileNo,
      fullAddress,
      state,
      district,
      password
    });

    await newCenter.save();

    // Return response without password
    const { password: _, ...centerData } = newCenter.toObject();

    res.status(201).json({
      message: 'Center created successfully',
      center: centerData
    });

  } catch (error) {
    console.error('Error creating center:', error);
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
};

// Get all centers
exports.getCenters = async (req, res) => {
  try {
    const centers = await Center.find();
    res.status(200).json({ success: true, data: centers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single center by ID
exports.getCenterById = async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) return res.status(404).json({ success: false, message: "Center not found" });
    res.status(200).json({ success: true, data: center });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update center
exports.updateCenter = async (req, res) => {
  try {
    const center = await Center.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!center) return res.status(404).json({ success: false, message: "Center not found" });
    res.status(200).json({ success: true, data: center });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete center
exports.deleteCenter = async (req, res) => {
  try {
    const center = await Center.findByIdAndDelete(req.params.id);
    if (!center) return res.status(404).json({ success: false, message: "Center not found" });
    res.status(200).json({ success: true, message: "Center deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
