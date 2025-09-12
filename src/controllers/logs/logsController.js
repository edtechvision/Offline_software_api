const Log = require("../../models/Log");

exports.getLogs = async (req, res) => {
  try {
    const {
      studentId,
      feeId,
      action,
      inchargeCode,
      user,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (action) filter.action = action;
    if (user) filter.user = user;
    if (inchargeCode) filter.inchargeCode = inchargeCode;

    if (studentId) filter["details.studentId"] = studentId;
    if (feeId) filter["details.feeId"] = feeId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      Log.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Log.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
