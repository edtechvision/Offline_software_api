const mongoose = require("mongoose");
const Student = require("../../models/Student"); // adjust path
const Fee = require("../../models/Fee"); // adjust path
const Center = require("../../models/Center"); // adjust path
const Course = require("../../models/Course"); // adjust path as needed
// 📊 Get how many students joined each course + percentage
const getCourseStats = async () => {
  try {
    // Step 1: Get total number of students
    const totalStudents = await Student.countDocuments();

    if (totalStudents === 0) {
      return []; // No students yet
    }

    // Step 2: Group students by courseId
    const courseStats = await Student.aggregate([
      {
        $group: {
          _id: "$courseDetails.courseId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "courses", // name of the collection for Course model
          localField: "_id",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      {
        $unwind: {
          path: "$courseInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          courseId: "$_id",
          courseName: "$courseInfo.name", // ✅ from Course model
          count: 1,
          percentage: {
            $round: [
              { $multiply: [{ $divide: ["$count", totalStudents] }, 100] },
              2,
            ],
          },
        },
      },
      {
        $sort: { count: -1 }, // sort descending by number of students
      },
    ]);

    return courseStats;
  } catch (error) {
    console.error("Error fetching course stats:", error);
    throw error;
  }
};

// Function to get total fees collected per month
// async function getMonthlyFeesReport() {
//   try {
//     const result = await Fee.aggregate([
//       { $unwind: "$paymentHistory" }, // break down payments array
//       {
//         $group: {
//           _id: {
//             year: { $year: "$paymentHistory.paymentDate" },
//             month: { $month: "$paymentHistory.paymentDate" },
//           },
//           totalCollected: { $sum: "$paymentHistory.amount" },
//           totalFine: { $sum: "$paymentHistory.fine" },
//           totalDiscount: { $sum: "$paymentHistory.discountAmount" },
//         },
//       },
//       {
//         $sort: { "_id.year": 1, "_id.month": 1 }, // chronological order
//       },
//       {
//         $project: {
//           _id: 0,
//           month: {
//             $concat: [
//               {
//                 $arrayElemAt: [
//                   [
//                     "",
//                     "January",
//                     "February",
//                     "March",
//                     "April",
//                     "May",
//                     "June",
//                     "July",
//                     "August",
//                     "September",
//                     "October",
//                     "November",
//                     "December",
//                   ],
//                   "$_id.month",
//                 ],
//               },
//               " ",
//               { $toString: "$_id.year" },
//             ],
//           },
//           totalCollected: 1,
//           totalFine: 1,
//           totalDiscount: 1,
//         },
//       },
//     ]);

//     return result;
//   } catch (err) {
//     console.error("Error generating monthly fee report:", err);
//     throw err;
//   }
// }

async function getMonthlyFeesReport() {
  try {
    const currentYear = new Date().getFullYear();

    const result = await Fee.aggregate([
      { $unwind: "$paymentHistory" },
      {
        // ✅ Only include payments from the current year
        $match: {
          $expr: {
            $eq: [{ $year: "$paymentHistory.paymentDate" }, currentYear],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentHistory.paymentDate" },
            month: { $month: "$paymentHistory.paymentDate" },
          },
          totalCollected: { $sum: "$paymentHistory.amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $arrayElemAt: [
              [
                "",
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              "$_id.month",
            ],
          },
          totalCollected: 1,
        },
      },
    ]);

    return result;
  } catch (err) {
    console.error("Error generating monthly fee report:", err);
    throw err;
  }
}

async function getMonthlyStudentEnrollmentReport() {
  try {
    const currentYear = new Date().getFullYear();

    // Aggregate enrollments by month
    const enrollmentData = await Student.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $year: "$createdAt" }, currentYear] },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalEnrollments: { $sum: 1 },
        },
      },
    ]);

    // Prepare a full 12-month array
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyReport = months.map((month, index) => {
      const monthData = enrollmentData.find((d) => d._id.month === index + 1);
      return {
        month,
        totalEnrollments: monthData ? monthData.totalEnrollments : 0,
      };
    });

    return monthlyReport;
  } catch (err) {
    console.error("Error generating monthly enrollment report:", err);
    throw err;
  }
}
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

    // 9. course data
    const courseData = await getCourseStats();

    // 10. fess Data Mothly
    const monthlyFeesData = await getMonthlyFeesReport();
    // 11. fess Data Mothly
    const studentEnrollment = await getMonthlyStudentEnrollmentReport();

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
        courseData,
        monthlyFeesData,
        studentEnrollment,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
