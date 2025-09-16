const Inquiry = require("../../models/Inquiry");

// Create Inquiry
exports.createInquiry = async (req, res) => {
  try {
    const { name, mobile, address, class: className, center } = req.body;

    // Basic validation
    if (!name || !mobile || !address || !className || !center) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const inquiry = new Inquiry({
      name,
      mobile,
      address,
      class: className,
      center,
    });

    const savedInquiry = await inquiry.save();

    res.status(201).json({
      message: "Inquiry created successfully",
      data: savedInquiry,
    });
  } catch (err) {
    console.error("Error creating inquiry:", err.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get All Inquiries
exports.getInquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    // Build search filter
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
            { center: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await Inquiry.countDocuments(searchFilter);
    const inquiries = await Inquiry.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ enquiry_date: -1 });

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      data: inquiries,
    });
  } catch (err) {
    console.error("Error fetching inquiries:", err.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
// Get Single Inquiry
exports.getInquiryById = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Inquiry
exports.updateInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Inquiry
exports.deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json({ message: "Inquiry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
