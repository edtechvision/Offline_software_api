const Admin = require("../../models/Admin");
const Center = require("../../models/Center");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Staff = require("../../models/Staff");

// @desc    Unified login for Admin & Center
// @route   POST /api/auth/login
// @access  Public
// const login = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;
//     // identifier = either admin email OR centerCode

//     let user, role;

//     // First check if identifier is an email (admin login)
//     const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
//     if (isEmail) {
//       user = await Admin.findOne({ email: identifier });
//       role = "admin";
//     } else {
//       // Otherwise, try center login by centerCode
//       user = await Center.findOne({ centerCode: identifier });
//       role = "incharge";
//     }

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // generate token
//     const token = jwt.sign(
//       { id: user._id, role },
//       process.env.JWT_SECRET || "your_jwt_secret",
//     );

//     // remove password before sending response
//     const { password: _, ...userData } = user.toObject();

//     res.json({
//       message: "Login successful",
//       role,
//       token,
//       user: userData,
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ message: "Something went wrong", error: error.message });
//   }
// };


// Login as Admin
const  loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" }
    );

    const { password: _, ...adminData } = admin.toObject();

    res.json({
      message: "Admin login successful",
      role: "admin",
      token,
      user: adminData,
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Login as Incharge
const loginIncharge = async (req, res) => {
  try {
    const { centerCode, password } = req.body;
    console.log(centerCode, password)

    const center = await Center.findOne({ centerCode });
    if (!center) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, center.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: center._id, role: "incharge" },
      process.env.JWT_SECRET || "your_jwt_secret",
    );

    const { password: _, ...centerData } = center.toObject();

    res.json({
      message: "Incharge login successful",
      role: "center",
      token,
      user: centerData,
    });
  } catch (error) {
    console.error("Incharge Login Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};
const loginStaff = async (req, res) => {
  try {
    const { staffcode, password } = req.body;
    console.log(staffcode, password)

    const staff = await Staff.findOne({ staffcode });
    if (!staff) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: staff._id, role: "staff" },
      process.env.JWT_SECRET || "your_jwt_secret",
    );

    const { password: _, ...staffData } = staff.toObject();

    res.json({
      message: "Staff login successful",
      role: "staff",
      token,
      user: staffData,
    });
  } catch (error) {
    console.error("Staff Login Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = { loginAdmin,loginIncharge,loginStaff };
