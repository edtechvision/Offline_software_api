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

const checkAdmissionIncharge = async (req, res) => {
  try {
    const { incharge_code } = req.body;

    if (!incharge_code) {
      return res.status(400).json({ message: "incharge_code is required" });
    }

    const incharge = await AdmissionIncharge.findOne({ incharge_code });

    if (!incharge) {
      return res.status(200).json({
        exists: false,
        message: "No Admission Incharge found with this code",
      });
    }

    return res.status(200).json({
      exists: true,
      incharge_name: incharge.incharge_name,
      incharge_code: incharge.incharge_code,
      email: incharge.email,
    });
  } catch (error) {
    console.error("Error checking Admission Incharge:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const toggleAdmissionIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { block } = req.body; // true or false

    const center = await AdmissionIncharge.findByIdAndUpdate(
      id,
      { isBlocked: block },
      { new: true }
    );

    if (!center) {
      return res.status(404).json({ message: "AdmissionIncharge not found" });
    }

    res.status(200).json({
      message: `AdmissionIncharge ${block ? "blocked" : "unblocked"} successfully`,
      center
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update Admission Incharge
const updateAdmissionIncharge = async (req, res) => {
  try {
    const { inchargeId } = req.params;
    const updates = req.body; // fields to update

    // If "center" is being updated, validate it
    if (updates.center) {
      const existingCenter = await Center.findById(updates.center);
      if (!existingCenter) {
        return res.status(404).json({ message: "Center not found" });
      }
    }

    // Prevent duplicates (email, aadhaar, mobile) if updated
    if (updates.email || updates.aadhaar_number || updates.mobile_number) {
      const conflict = await AdmissionIncharge.findOne({
        _id: { $ne: inchargeId }, // exclude current record
        $or: [
          updates.email ? { email: updates.email } : {},
          updates.aadhaar_number ? { aadhaar_number: updates.aadhaar_number } : {},
          updates.mobile_number ? { mobile_number: updates.mobile_number } : {}
        ]
      });

      if (conflict) {
        return res.status(400).json({ message: "Another Incharge exists with same email, Aadhaar, or mobile number" });
      }
    }

    const updatedIncharge = await AdmissionIncharge.findByIdAndUpdate(
      inchargeId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedIncharge) {
      return res.status(404).json({ message: "Admission Incharge not found" });
    }

    res.status(200).json({
      message: "Admission Incharge updated successfully",
      admissionIncharge: updatedIncharge,
    });
  } catch (error) {
    console.error("Error updating Admission Incharge:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
module.exports = { createAdmissionIncharge,getAdmissionIncharges,checkAdmissionIncharge,toggleAdmissionIncharge,updateAdmissionIncharge };
