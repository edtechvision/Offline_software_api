const mongoose = require("mongoose");
const Student = require("../../models/Student"); // adjust path
const Fee = require("../../models/Fee"); // adjust path
const Center = require("../../models/Center"); // adjust path

// Dashboard API
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Current month range
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // ✅ 1. Total students
    const totalStudents = await Student.countDocuments();

    // ✅ 2. Today's admissions
    const todaysAdmissions = await Student.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // ✅ 3. Total collected fees
    const totalCollectedAgg = await Fee.aggregate([
      { $unwind: "$paymentHistory" },
      { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
    ]);
    const totalCollectedFees = totalCollectedAgg[0]?.total || 0;

    // ✅ 4. Today's collected fees
    const todaysCollectedAgg = await Fee.aggregate([
      { $unwind: "$paymentHistory" },
      {
        $match: {
          "paymentHistory.paymentDate": { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
    ]);
    const todaysCollectedFees = todaysCollectedAgg[0]?.total || 0;

    // ✅ 5. Total pending fees
    const totalPendingAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: "$pendingAmount" } } },
    ]);
    const totalPendingFees = totalPendingAgg[0]?.total || 0;

    // ✅ 6. Current month total collected fees
    const currentMonthCollectedAgg = await Fee.aggregate([
      { $unwind: "$paymentHistory" },
      {
        $match: {
          "paymentHistory.paymentDate": {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
    ]);
    const currentMonthCollectedFees = currentMonthCollectedAgg[0]?.total || 0;

    // ✅ 7. Current month admissions
    const currentMonthAdmissions = await Student.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // ✅ 8. Total centers
    const totalCenters = await Center.countDocuments();

    // ✅ Current month name
    const monthName = startOfMonth.toLocaleString("en-US", { month: "long" });

    // Final response
    res.json({
      success: true,
      data: {
        totalStudents,
        todaysAdmissions,
        totalCollectedFees,
        todaysCollectedFees,
        totalPendingFees,
        currentMonth: monthName,
        currentMonthCollectedFees,
        currentMonthAdmissions,
        totalCenters,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
