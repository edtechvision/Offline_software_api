const Holiday = require("../../models/Holiday");


// ✅ Add a new holiday
exports.addHoliday = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: "Title and Date are required",
      });
    }

    // Prevent duplicate holiday on same date
    const existingHoliday = await Holiday.findOne({ date });
    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: "Holiday already marked for this date",
      });
    }

    const holiday = new Holiday({
      title,
      description,
      date,
    });

    const savedHoliday = await holiday.save();

    res.status(201).json({
      success: true,
      message: "Holiday added successfully",
      data: savedHoliday,
    });
  } catch (error) {
    console.error("Error adding holiday:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Get all holidays (with optional month/year filter)
exports.getHolidays = async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const holidays = await Holiday.find(filter)
      .populate("createdBy", "staffname staffcode")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      message: "Holiday list fetched successfully",
      total: holidays.length,
      data: holidays,
    });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Delete a holiday
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedHoliday = await Holiday.findByIdAndDelete(id);

    if (!deletedHoliday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Update holiday details
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date } = req.body;

    const updatedHoliday = await Holiday.findByIdAndUpdate(
      id,
      { title, description, date },
      { new: true }
    );

    if (!updatedHoliday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: updatedHoliday,
    });
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
