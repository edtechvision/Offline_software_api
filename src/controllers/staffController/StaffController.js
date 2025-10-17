
const bcrypt = require("bcryptjs");
const Staff = require("../../models/Staff");

// Create new staff
exports.createStaff = async (req, res) => {
  try {
    const { staffname, password, mobile_number } = req.body;

    // Generate unique staffcode
    let staffcode;
    let isUnique = false;

    while (!isUnique) {
      const randomCode = "TB" + Math.floor(10000 + Math.random() * 90000);
      const existing = await Staff.findOne({ staffcode: randomCode });
      if (!existing) {
        staffcode = randomCode;
        isUnique = true;
      }
    }

    // Check if mobile number already exists
    const existingMobile = await Staff.findOne({ mobile_number });
    if (existingMobile) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff
    const staff = new Staff({
      staffname,
      staffcode,
      password: hashedPassword,
      plainPassword: password, // ⚠️ remove this for production
      mobile_number,
    });

    await staff.save();

    res.status(201).json({
      message: "Staff created successfully",
      staff,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating staff",
      error: error.message,
    });
  }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error: error.message });
  }
};

// Get single staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error: error.message });
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedStaff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ message: "Staff updated successfully", updatedStaff });
  } catch (error) {
    res.status(500).json({ message: "Error updating staff", error: error.message });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting staff", error: error.message });
  }
};

// Login staff
exports.loginStaff = async (req, res) => {
  try {
    const { staffcode, password } = req.body;
    const staff = await Staff.findOne({ staffcode });
    if (!staff) return res.status(404).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (staff.isBlocked)
      return res.status(403).json({ message: "Account is blocked" });

    res.status(200).json({ message: "Login successful", staff });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

// Block or Unblock staff
exports.toggleBlockStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.isBlocked = !staff.isBlocked;
    await staff.save();

    res.status(200).json({
      message: `Staff ${staff.isBlocked ? "blocked" : "unblocked"} successfully`,
      staff,
    });
  } catch (error) {
    res.status(500).json({ message: "Error toggling block status", error: error.message });
  }
};
