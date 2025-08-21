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
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Search filter
    const searchFilter = search
      ? {
          $or: [
            { centerName: { $regex: search, $options: "i" } },
            { centerHeadName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { centerHeadMobileNo: { $regex: search, $options: "i" } },
            { centerCode: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await Center.countDocuments(searchFilter);

    const centers = await Center.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: centers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
