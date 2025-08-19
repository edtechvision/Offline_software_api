const AdmissionIncharge = require("../../models/AdmissionIncharge");
const Center = require("../../models/Center");

// @desc    Create a new Admission Incharge
// @route   POST /api/admission-incharge
// @access  Public (or Protected depending on auth)
const createAdmissionIncharge = async (req, res) => {
  try {
    const {
      incharge_name,
      email,
      mobile_number,
      aadhaar_number,
      full_address,
      center, // expecting Center _id
    } = req.body;

    // Check if given center exists
    const existingCenter = await Center.findById(center);
    if (!existingCenter) {
      return res.status(404).json({ message: "Center not found" });
    }

    // Check for duplicate email or Aadhaar
    const existingIncharge = await AdmissionIncharge.findOne({
      $or: [{ email }, { aadhaar_number }, { mobile_number }],
    });
    if (existingIncharge) {
      return res.status(400).json({ message: "Incharge already exists with given email, Aadhaar, or mobile number" });
    }

    const newIncharge = new AdmissionIncharge({
      incharge_name,
      email,
      mobile_number,
      aadhaar_number,
      full_address,
      center,
    });

    await newIncharge.save();

    res.status(201).json({
      message: "Admission Incharge created successfully",
      admissionIncharge: newIncharge,
    });
  } catch (error) {
    console.error("Error creating Admission Incharge:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

module.exports = { createAdmissionIncharge };
