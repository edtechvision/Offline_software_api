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


     // keep plain password
    const plainPassword = password;
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
      password,
      plainPassword
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
    const { id } = req.params; // Center ID from route
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

    // Find center
    const center = await Center.findById(id);
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    // If email is being updated, check uniqueness
    if (email && email !== center.email) {
      const existingCenter = await Center.findOne({ email });
      if (existingCenter) {
        return res.status(400).json({ message: 'Email already registered with another center' });
      }
      center.email = email;
    }

    // Update fields if provided
    if (centerName) center.centerName = centerName;
    if (centerHeadName) center.centerHeadName = centerHeadName;
    if (centerHeadMobileNo) center.centerHeadMobileNo = centerHeadMobileNo;
    if (fullAddress) center.fullAddress = fullAddress;
    if (state) center.state = state;
    if (district) center.district = district;

    // Update password if provided
    if (password) {
      center.password = password;
      center.plainPassword = password; // keep plain version like in create
    }

    const updatedCenter = await center.save();

    // Remove password from response
    const { password: _, plainPassword, ...centerData } = updatedCenter.toObject();

    res.status(200).json({
      message: 'Center updated successfully',
      center: centerData
    });

  } catch (error) {
    console.error('Error updating center:', error);
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
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

// Block/Unblock a center
exports.toggleBlockCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { block } = req.body; // true or false

    const center = await Center.findByIdAndUpdate(
      centerId,
      { isBlocked: block },
      { new: true }
    );

    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    res.status(200).json({
      message: `Center ${block ? "blocked" : "unblocked"} successfully`,
      center
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

