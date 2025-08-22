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
      incharge_code:'TBINC' + Math.floor(10000 + Math.random() * 90000),
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

const getAdmissionIncharges = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Build search filter
    const searchFilter = search
      ? {
          $or: [
            { incharge_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobile_number: { $regex: search, $options: "i" } },
            { aadhaar_number: { $regex: search, $options: "i" } },
            { incharge_code: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await AdmissionIncharge.countDocuments(searchFilter);

    const incharges = await AdmissionIncharge.find(searchFilter)
      .populate("center", "centerName centerCode") // show center details
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      incharges,
    });
  } catch (error) {
    console.error("Error fetching Admission Incharges:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


module.exports = { createAdmissionIncharge,getAdmissionIncharges };
