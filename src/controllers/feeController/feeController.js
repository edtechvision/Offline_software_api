// controllers/feeController.js
const { createLog } = require("../../helpers/logger");
const AdmissionIncharge = require("../../models/AdmissionIncharge");
const Fee = require("../../models/Fee");
const Student = require("../../models/Student");
const s3 = require("../../utils/s3");

// ✅ Create Fee Record for a Student
exports.createFee = async (req, res) => {
  try {
    const {
      studentId,
      totalFee,
      paidAmount,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const pendingAmount = totalFee - (paidAmount || 0);

    const fee = new Fee({
      studentId,
      courseId: student.courseDetails?.courseId,
      batchId: student.courseDetails?.batchId,
      totalFee,
      paidAmount: paidAmount || 0,
      pendingAmount,
      paymentHistory: paidAmount
        ? [
            {
              amount: paidAmount,
              paymentMode,
              transactionId,
              remarks,
            },
          ]
        : [],
      status:
        pendingAmount === 0
          ? "Completed"
          : paidAmount > 0
          ? "Partial"
          : "Pending",
    });

    const savedFee = await fee.save();

    res.status(201).json({
      success: true,
      message: "Fee record created successfully",
      data: savedFee,
    });
  } catch (error) {
    console.error("Error creating fee:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ✅ Add Payment (Update Fee Record)
// Helper function to generate receipt number
function generateReceiptNo() {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `TBREC${randomNum}`;
}

// ✅ Get Fees by Student
// exports.getStudentFees = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     const fees = await Fee.find({ studentId })
//       .populate("studentId", "studentName className registrationNo")
//       .populate("courseId", "name fee")
//       .populate("batchId", "batchName");

//     res.status(200).json({
//       success: true,
//       message: "Student fees retrieved successfully",
//       data: fees,
//     });
//   } catch (error) {
//     console.error("Error fetching student fees:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// exports.addPayment = async (req, res) => {
//   try {
//     const {
//       feeId,
//       amount, // ✅ treated as final paid amount (after discount)
//       paymentMode,
//       transactionId,
//       remarks,
//       paymentDate,
//       discountCode,
//       discountAmount = 0,
//       fine = 0,
//     } = req.body;

//     const fee = await Fee.findById(feeId);
//     if (!fee) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Fee record not found" });
//     }

//     // ✅ Force numeric values
//     const prevPaid = Number(fee.paidAmount) || 0;
//     const amt = Number(amount) || 0;
//     const extraFine = Number(fine) || 0;

//     // ✅ Previous received amount before this payment
//     const previousReceivedAmount = prevPaid;

//     // ✅ Update payment totals
//     const netAmount = amt + extraFine;
//     fee.paidAmount = prevPaid + netAmount;
//     fee.pendingAmount = Math.max(0, Number(fee.totalFee) - fee.paidAmount);

//     // ✅ Handle optional discount file upload
//     let discountFileUrl = null;
//     if (req.file) {
//       const params = {
//         Bucket: process.env.DO_SPACE_BUCKET,
//         Key: `discounts/${Date.now()}_${req.file.originalname}`,
//         Body: req.file.buffer,
//         ACL: "public-read",
//         ContentType: req.file.mimetype,
//       };

//       const uploaded = await s3.upload(params).promise();
//       discountFileUrl = uploaded.Location;
//     }

//     // ✅ Add payment history
//     fee.paymentHistory.push({
//       amount: amt,
//       fine: extraFine,
//       discountCode,
//       discountAmount: Number(discountAmount) || 0,
//       discountFile: discountFileUrl,
//       previousReceivedAmount,
//       pendingAmountAfterPayment: fee.pendingAmount,
//       paymentMode,
//       transactionId,
//       remarks,
//       paymentDate: paymentDate || Date.now(),
//       receiptNo: generateReceiptNo(),
//     });

//     // ✅ Update status
//     if (fee.pendingAmount === 0) {
//       fee.status = "Completed";
//     } else if (fee.paidAmount > 0) {
//       fee.status = "Partial";
//     } else {
//       fee.status = "Pending";
//     }

//     const updatedFee = await fee.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment added successfully",
//       data: updatedFee,
//     });
//   } catch (error) {
//     console.error("Error adding payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// exports.addPayment = async (req, res) => {
//   try {
//     const {
//       feeId,
//       amount, // ✅ amount student actually paid (after discount)
//       paymentMode,
//       transactionId,
//       remarks,
//       paymentDate,
//       discountCode,
//       discountAmount = 0,
//       fine = 0,
//     } = req.body;

//     const fee = await Fee.findById(feeId);
//     if (!fee) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Fee record not found" });
//     }

//     // ✅ Force numeric values
//     const prevPaid = Number(fee.paidAmount) || 0;
//     const amt = Number(amount) || 0;
//     const extraFine = Number(fine) || 0;
//     const effectiveDiscount = Number(discountAmount) || 0;

//     // ✅ Previous received amount before this payment
//     const previousReceivedAmount = prevPaid;

//     // ✅ Update payment totals
//     const netAmount = amt + extraFine;

//     // Paid amount = only what student actually paid (not discount)
//     fee.paidAmount = prevPaid + netAmount;

//     // Track total discounts on fee
//     fee.totalDiscount = (Number(fee.totalDiscount) || 0) + effectiveDiscount;

//     // Pending = totalFee - (paid + totalDiscount)
//     fee.pendingAmount = Math.max(
//       0,
//       Number(fee.totalFee) - (fee.paidAmount + fee.totalDiscount)
//     );

//     // ✅ Handle optional discount file upload
//     let discountFileUrl = null;
//     if (req.file) {
//       const params = {
//         Bucket: process.env.DO_SPACE_BUCKET,
//         Key: `discounts/${Date.now()}_${req.file.originalname}`,
//         Body: req.file.buffer,
//         ACL: "public-read",
//         ContentType: req.file.mimetype,
//       };

//       const uploaded = await s3.upload(params).promise();
//       discountFileUrl = uploaded.Location;
//     }

//     // ✅ Add payment history
//     fee.paymentHistory.push({
//       amount: amt,
//       fine: extraFine,
//       discountCode,
//       discountAmount: effectiveDiscount,
//       discountFile: discountFileUrl,
//       previousReceivedAmount,
//       pendingAmountAfterPayment: fee.pendingAmount,
//       paymentMode,
//       transactionId,
//       remarks,
//       paymentDate: paymentDate || Date.now(),
//       receiptNo: generateReceiptNo(),
//     });

//     // ✅ Update status
//     if (fee.pendingAmount === 0) {
//       fee.status = "Completed";
//     } else if (fee.paidAmount > 0) {
//       fee.status = "Partial";
//     } else {
//       fee.status = "Pending";
//     }

//     const updatedFee = await fee.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment added successfully",
//       data: updatedFee,
//     });
//   } catch (error) {
//     console.error("Error adding payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// exports.addPayment = async (req, res) => {
//   try {
//     const {
//       feeId,
//       amount,
//       paymentMode,
//       transactionId,
//       remarks,
//       paymentDate,
//       discountCode,
//       discountAmount = 0,
//       fine = 0,
//       collectedBy, // ✅ "Admin" or "Incharge"
//       inchargeCode, // ✅ optional
//       nextPaymentDueDate, // ✅ optional update
//     } = req.body;

//     const fee = await Fee.findById(feeId);
//     if (!fee) {
//       return res.status(404).json({ success: false, message: "Fee record not found" });
//     }

//     if (!["Admin", "Incharge"].includes(collectedBy)) {
//       return res.status(400).json({ success: false, message: "Invalid collectedBy value" });
//     }

//     if (collectedBy === "Incharge" && !inchargeCode) {
//       return res.status(400).json({ success: false, message: "Incharge code is required when collectedBy is Incharge" });
//     }

//     const prevPaid = Number(fee.paidAmount) || 0;
//     const amt = Number(amount) || 0;
//     const extraFine = Number(fine) || 0;
//     const effectiveDiscount = Number(discountAmount) || 0;

//     const previousReceivedAmount = prevPaid;
//     const netAmount = amt + extraFine;

//     fee.paidAmount = prevPaid + netAmount;
//     fee.totalDiscount = (Number(fee.totalDiscount) || 0) + effectiveDiscount;
//     fee.pendingAmount = Math.max(0, Number(fee.totalFee) - (fee.paidAmount + fee.totalDiscount));

//     let discountFileUrl = null;
//     if (req.file) {
//       const params = {
//         Bucket: process.env.DO_SPACE_BUCKET,
//         Key: `discounts/${Date.now()}_${req.file.originalname}`,
//         Body: req.file.buffer,
//         ACL: "public-read",
//         ContentType: req.file.mimetype,
//       };
//       const uploaded = await s3.upload(params).promise();
//       discountFileUrl = uploaded.Location;
//     }

//     fee.paymentHistory.push({
//       amount: amt,
//       fine: extraFine,
//       discountCode,
//       discountAmount: effectiveDiscount,
//       discountFile: discountFileUrl,
//       previousReceivedAmount,
//       pendingAmountAfterPayment: fee.pendingAmount,
//       paymentMode,
//       transactionId,
//       remarks,
//       paymentDate: paymentDate || Date.now(),
//       receiptNo: generateReceiptNo(),

//       // ✅ new tracking fields
//       collectedBy,
//       inchargeCode: collectedBy === "Incharge" ? inchargeCode : null,
//     });

//     // ✅ Update nextPaymentDueDate if provided
//     if (nextPaymentDueDate) {
//       fee.nextPaymentDueDate = nextPaymentDueDate;
//     }
//     fee.status = fee.pendingAmount === 0 ? "Completed" : fee.paidAmount > 0 ? "Partial" : "Pending";
//     const updatedFee = await fee.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment added successfully",
//       data: updatedFee,
//     });
//   } catch (error) {
//     console.error("Error adding payment:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.addPayment = async (req, res) => {
  try {
    const {
      feeId,
      amount,
      paymentMode,
      transactionId,
      remarks,
      paymentDate,
      discountCode,
      discountAmount = 0,
      fine = 0,
      collectedBy, // ✅ "Admin" or undefined (when Incharge)
      inchargeCode, // ✅ optional
      nextPaymentDueDate, // ✅ optional update
    } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });
    }

    let collectedByName = null;
    let inchargeCodeValue = null;

    if (collectedBy === "Admin") {
      // ✅ Admin payment
      collectedByName = "Admin";
    } else if (inchargeCode) {
      // ✅ Incharge payment → find by code
      const incharge = await AdmissionIncharge.findOne({
        incharge_code: inchargeCode,
        isBlocked: false,
      });

      if (!incharge) {
        return res.status(404).json({
          success: false,
          message: "Incharge not found for given code",
        });
      }

      collectedByName = incharge.incharge_name;
      inchargeCodeValue = incharge.incharge_code;
    } else {
      return res.status(400).json({
        success: false,
        message: "Either collectedBy=Admin or valid inchargeCode is required",
      });
    }

    const prevPaid = Number(fee.paidAmount) || 0;
    const amt = Number(amount) || 0;
    const extraFine = Number(fine) || 0;
    const effectiveDiscount = Number(discountAmount) || 0;

    const previousReceivedAmount = prevPaid;
    const netAmount = amt + extraFine;

    fee.paidAmount = prevPaid + netAmount;
    fee.totalDiscount = (Number(fee.totalDiscount) || 0) + effectiveDiscount;
    fee.pendingAmount = Math.max(
      0,
      Number(fee.totalFee) - (fee.paidAmount + fee.totalDiscount)
    );

    let discountFileUrl = null;
    if (req.file) {
      const params = {
        Bucket: process.env.DO_SPACE_BUCKET,
        Key: `discounts/${Date.now()}_${req.file.originalname}`,
        Body: req.file.buffer,
        ACL: "public-read",
        ContentType: req.file.mimetype,
      };
      const uploaded = await s3.upload(params).promise();
      discountFileUrl = uploaded.Location;
    }

    fee.paymentHistory.push({
      amount: amt,
      fine: extraFine,
      discountCode,
      discountAmount: effectiveDiscount,
      discountFile: discountFileUrl,
      previousReceivedAmount,
      pendingAmountAfterPayment: fee.pendingAmount,
      paymentMode,
      transactionId,
      remarks,
      paymentDate: paymentDate || Date.now(),
      receiptNo: generateReceiptNo(),

      // ✅ Save collectedBy as name (Admin / incharge_name)
      collectedBy: collectedByName,
      inchargeCode: inchargeCodeValue,
    });

    // ✅ Update nextPaymentDueDate if provided
    if (nextPaymentDueDate) {
      fee.nextPaymentDueDate = nextPaymentDueDate;
    }

    fee.status =
      fee.pendingAmount === 0
        ? "Completed"
        : fee.paidAmount > 0
        ? "Partial"
        : "Pending";

    const updatedFee = await fee.save();

    // ✅ Async-safe Log
    createLog({
      action: "PAYMENT_ADDED",
      user: collectedByName, // Admin or Incharge Name
      inchargeCode: inchargeCodeValue,
      details: {
        feeId: fee._id,
        studentId: fee.studentId,
        courseId: fee.courseId,
        batchId: fee.batchId,
        paidAmount: amt,
        fine: extraFine,
        discountApplied: effectiveDiscount,
        pendingAmount: fee.pendingAmount,
        status: updatedFee.status,
        remarks,
        paymentMode,
        transactionId,
        receiptNo: fee.paymentHistory[fee.paymentHistory.length - 1].receiptNo,
      },
    }).catch((err) => {
      console.error("Log creation failed:", err.message);
    });

    res.status(200).json({
      success: true,
      message: "Payment added successfully",
      data: updatedFee,
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// exports.getStudentFees = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     const fees = await Fee.find({ studentId })
//       .populate(
//         "studentId",
//         "-__v -qrCode -presentAddress -permanentAddress -courseDetails"
//       ) // ✅ exclude qrCode
//       .populate("courseId", "name fee") // keep course limited
//       .populate("batchId", "batchName"); // keep batch limited

//     if (!fees || fees.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No fee records found for this student",
//       });
//     }

//     // 🔍 Enrich paymentHistory with incharge_name
//     for (let fee of fees) {
//       for (let payment of fee.paymentHistory) {
//         if (payment.inchargeCode) {
//           const incharge = await AdmissionIncharge.findOne(
//             { incharge_code: payment.inchargeCode },
//             "incharge_name"
//           );
//           if (incharge) {
//             payment = payment.toObject ? payment.toObject() : payment;
//             payment.inchargeName = incharge.incharge_name;
//           }
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Student fees retrieved successfully",
//       data: fees,
//     });
//   } catch (error) {
//     console.error("Error fetching student fees:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ studentId })
      .populate(
        "studentId",
        "-__v -qrCode -presentAddress -permanentAddress -courseDetails"
      )
      .populate("courseId", "name fee")
      .populate("batchId", "batchName")
      .lean(); // ✅ Converts to plain JS objects so we can freely modify

    if (!fees || fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No fee records found for this student",
      });
    }

    // ✅ Collect all unique inchargeCodes across all payments
    const allCodes = [
      ...new Set(
        fees.flatMap((fee) =>
          fee.paymentHistory.map((p) => p.inchargeCode).filter((code) => !!code)
        )
      ),
    ];

    // ✅ Fetch all incharges at once
    const incharges = await AdmissionIncharge.find(
      { incharge_code: { $in: allCodes } },
      "incharge_code incharge_name"
    ).lean();

    const inchargeMap = Object.fromEntries(
      incharges.map((i) => [i.incharge_code, i.incharge_name])
    );

    // ✅ Add inchargeName to each payment record
    for (const fee of fees) {
      fee.paymentHistory = fee.paymentHistory.map((payment) => ({
        ...payment,
        inchargeName: payment.inchargeCode
          ? inchargeMap[payment.inchargeCode] || null
          : null,
      }));
    }

    res.status(200).json({
      success: true,
      message: "Student fees retrieved successfully",
      data: fees,
    });
  } catch (error) {
    console.error("Error fetching student fees:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { feeId } = req.params;

    const fee = await Fee.findById(feeId).populate(
      "studentId",
      "studentName registrationNo"
    ); // optional populate
    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      student: fee.studentId, // optional student info
      totalFee: fee.totalFee,
      paidAmount: fee.paidAmount,
      pendingAmount: fee.pendingAmount,
      status: fee.status,
      payments: fee.paymentHistory, // all payments
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// exports.getAllPayments = async (req, res) => {
//   try {
//     const fees = await Fee.find()
//       .populate("studentId", "studentName registrationNo className")
//       .populate("courseId", "name")
//       .populate("batchId", "batchName");

//     if (!fees || fees.length === 0) {
//       return res.status(404).json({ success: false, message: "No payments found" });
//     }

//     // Flatten payment history with student & course info
//     const allPayments = fees.flatMap((fee) =>
//       fee.paymentHistory.map((payment) => ({
//         studentId: fee.studentId?._id,
//         studentName: fee.studentId?.studentName,
//         registrationNo: fee.studentId?.registrationNo,
//         className: fee.studentId?.className,
//         courseName: fee.courseId?.name,
//         batchName: fee.batchId?.batchName,
//         totalFee: fee.totalFee,
//         paymentDate: payment.paymentDate,
//         amount: payment.amount,
//         previousReceivedAmount: payment.previousReceivedAmount,
//         pendingAmountAfterPayment: payment.pendingAmountAfterPayment,
//         paymentMode: payment.paymentMode,
//         transactionId: payment.transactionId,
//         remarks: payment.remarks,
//         receiptNo: payment.receiptNo,
//       }))
//     );

//     res.status(200).json({
//       success: true,
//       message: "All payments fetched successfully",
//       totalPayments: allPayments.length,
//       data: allPayments,
//     });
//   } catch (error) {
//     console.error("Error fetching all payments:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// exports.revertPayment = async (req, res) => {
//   try {
//     const { feeId, receiptNo } = req.body;

//     const fee = await Fee.findById(feeId);
//     if (!fee) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Fee record not found" });
//     }

//     // ✅ Find payment by receiptNo
//     const paymentIndex = fee.paymentHistory.findIndex(
//       (p) => p.receiptNo === receiptNo
//     );

//     if (paymentIndex === -1) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Payment record not found" });
//     }

//     // ✅ Get payment to delete
//     const paymentToDelete = fee.paymentHistory[paymentIndex];

//     // ✅ Net effect (since amount is already final after discount)
//     const netAmount =
//       (paymentToDelete.amount || 0) + (paymentToDelete.fine || 0);

//     // ✅ Deduct from totals
//     fee.paidAmount = Math.max(0, fee.paidAmount - netAmount);
//     fee.pendingAmount = Math.max(0, fee.totalFee - fee.paidAmount);

//     // ✅ Remove payment from history
//     fee.paymentHistory.splice(paymentIndex, 1);

//     // ✅ Update status
//     if (fee.pendingAmount === 0) {
//       fee.status = "Completed";
//     } else if (fee.paidAmount > 0) {
//       fee.status = "Partial";
//     } else {
//       fee.status = "Pending";
//     }

//     const updatedFee = await fee.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment reverted (deleted) successfully",
//       data: updatedFee,
//     });
//   } catch (error) {
//     console.error("Error reverting payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };
exports.getAllPayments = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      paymentMode,
      search,
      startDate,
      endDate,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // ✅ Build query conditions
    const matchStage = {};

    if (paymentMode) {
      matchStage["paymentHistory.paymentMode"] = paymentMode;
    }

    if (startDate || endDate) {
      matchStage["paymentHistory.paymentDate"] = {};
      if (startDate)
        matchStage["paymentHistory.paymentDate"]["$gte"] = new Date(startDate);
      if (endDate)
        matchStage["paymentHistory.paymentDate"]["$lte"] = new Date(endDate);
    }

    // ✅ Fetch fees with populated data
    const fees = await Fee.find(matchStage)
      .populate("studentId", "studentName registrationNo className")
      .populate("courseId", "name")
      .populate("batchId", "batchName");

    if (!fees || fees.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No payments found" });
    }

    // ✅ Flatten payment history
    let allPayments = fees.flatMap((fee) =>
      fee.paymentHistory.map((payment) => ({
        studentId: fee.studentId?._id,
        studentName: fee.studentId?.studentName,
        registrationNo: fee.studentId?.registrationNo,
        className: fee.studentId?.className,
        courseName: fee.courseId?.name,
        batchName: fee.batchId?.batchName,
        totalFee: fee.totalFee,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        previousReceivedAmount: payment.previousReceivedAmount,
        pendingAmountAfterPayment: payment.pendingAmountAfterPayment,
        paymentMode: payment.paymentMode,
        transactionId: payment.transactionId,
        remarks: payment.remarks,
        receiptNo: payment.receiptNo,
      }))
    );

    // ✅ Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allPayments = allPayments.filter(
        (p) =>
          p.studentName?.toLowerCase().includes(searchLower) ||
          p.registrationNo?.toLowerCase().includes(searchLower) ||
          p.className?.toLowerCase().includes(searchLower)
      );
    }

    // ✅ Apply pagination
    const totalPayments = allPayments.length;
    const startIndex = (page - 1) * limit;
    const paginatedPayments = allPayments.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      message: "All payments fetched successfully",
      page,
      limit,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
      data: paginatedPayments,
    });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.revertPayment = async (req, res) => {
  try {
    const { feeId, receiptNo } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });
    }

    // ✅ Find payment by receiptNo
    const paymentIndex = fee.paymentHistory.findIndex(
      (p) => p.receiptNo === receiptNo
    );

    if (paymentIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found" });
    }

    // ✅ Get payment to revert
    const paymentToDelete = fee.paymentHistory[paymentIndex];

    // ✅ Normalize all values to numbers
    const totalFee = Number(fee.totalFee) || 0;
    const paidAmount = Number(fee.paidAmount) || 0;
    const totalDiscount = Number(fee.totalDiscount) || 0;

    const amount = Number(paymentToDelete.amount) || 0;
    const fine = Number(paymentToDelete.fine) || 0;
    const discountAmount = Number(paymentToDelete.discountAmount) || 0;

    // ✅ Net effect (paid + fine only, discount handled separately)
    const netAmount = amount + fine;

    // ✅ Deduct paid amount (never NaN)
    const updatedPaidAmount = Math.max(0, paidAmount - netAmount);
    fee.paidAmount = updatedPaidAmount;

    // ✅ Deduct discount from totalDiscount (never NaN)
    let updatedDiscount = totalDiscount;
    if (discountAmount > 0) {
      updatedDiscount = Math.max(0, totalDiscount - discountAmount);
    }
    fee.totalDiscount = updatedDiscount;

    // ✅ Recalculate pending safely
    const recalculatedPending =
      totalFee - (updatedPaidAmount + updatedDiscount);

    fee.pendingAmount = Math.max(0, Number(recalculatedPending) || 0);

    // ✅ Remove payment from history
    fee.paymentHistory.splice(paymentIndex, 1);

    // ✅ Update status
    if (fee.pendingAmount === 0) {
      fee.status = "Completed";
    } else if (fee.paidAmount > 0) {
      fee.status = "Partial";
    } else {
      fee.status = "Pending";
    }

    // 🔍 Debugging log (safe calculation values)
    console.log("Recalculated Fee values:", {
      totalFee,
      paidAmount: fee.paidAmount,
      totalDiscount: fee.totalDiscount,
      pendingAmount: fee.pendingAmount,
      status: fee.status,
    });

    const updatedFee = await fee.save();

    // ✅ Async-safe Log
    createLog({
      action: "PAYMENT_REVERTED",
      user: paymentToDelete.collectedBy, // Admin / Incharge
      inchargeCode: paymentToDelete.inchargeCode || null,
      details: {
        feeId: fee._id,
        studentId: fee.studentId,
        courseId: fee.courseId,
        batchId: fee.batchId,
        revertedReceiptNo: receiptNo,
        revertedAmount: amount,
        revertedFine: fine,
        revertedDiscount: discountAmount,
        pendingAmount: fee.pendingAmount,
        status: updatedFee.status,
      },
    }).catch((err) => {
      console.error("Log creation failed:", err.message);
    });

    res.status(200).json({
      success: true,
      message: "Payment reverted (deleted) successfully",
      data: updatedFee,
    });
  } catch (error) {
    console.error("Error reverting payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getPendingFees = async (req, res) => {
  try {
    const fees = await Fee.find({ pendingAmount: { $gt: 0 } }) // only students with pending fees
      .populate("studentId", "studentName registrationNo mobileNumber email")
      .populate("courseId", "name");

    if (!fees || fees.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pending fees found" });
    }

    const pendingFeesList = fees.map((fee) => ({
      studentId: fee.studentId?._id,
      studentName: fee.studentId?.studentName,
      studentEmail: fee.studentId?.email,
      registrationNo: fee.studentId?.registrationNo,
      contactNumber: fee.studentId?.mobileNumber,
      courseName: fee.courseId?.name,
      courseFee: fee.totalFee,
      totalReceivedFees: fee.paidAmount,
      pendingFees: fee.pendingAmount,
      nextDueDate: fee.nextPaymentDueDate,
    }));

    res.status(200).json({
      success: true,
      message: "Pending fees list fetched successfully",
      totalStudents: pendingFeesList.length,
      data: pendingFeesList,
    });
  } catch (error) {
    console.error("Error fetching pending fees:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getCollectFeesStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      batchId,
      courseId,
      className,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search + filter query
    const searchQuery = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      searchQuery.$or = [
        { studentName: searchRegex },
        { fathersName: searchRegex },
        { mothersName: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex },
        { adharNumber: searchRegex },
        { inchargeName: searchRegex },
        { inchargeCode: searchRegex },
        { collegeName: searchRegex },
        { className: searchRegex },
        { "presentAddress.city": searchRegex },
        { "presentAddress.state": searchRegex },
      ];
    }

    if (batchId) {
      searchQuery["courseDetails.batchId"] = batchId;
    }
    if (courseId) {
      searchQuery["courseDetails.courseId"] = courseId;
    }
    if (className) {
      searchQuery["className"] = className;
    }

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // ✅ Fetch students with filters + populate course/batch
    const students = await Student.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select("studentName fathersName mobileNumber className courseDetails")
      .populate("courseDetails.courseId", "name")
      .populate("courseDetails.batchId", "batchName");

    // ✅ Fetch fee data for these students
    const studentIds = students.map((s) => s._id);
    const fees = await Fee.find({ studentId: { $in: studentIds } }).select(
      "studentId totalFee paidAmount pendingAmount"
    );

    const feeMap = {};
    fees.forEach((fee) => {
      feeMap[fee.studentId.toString()] = fee;
    });

    // ✅ Transform final response
    const result = students.map((s) => {
      const fee = feeMap[s._id.toString()] || {};
      return {
        studentId: s._id, // <-- add studentId here

        studentName: s.studentName,
        fathersName: s.fathersName,
        mobileNumber: s.mobileNumber,
        className: s.className,
        course: s.courseDetails?.courseId?.name || "-",
        batch: s.courseDetails?.batchId?.batchName || "-",
        totalFee: fee.totalFee || 0,
        paidAmount: fee.paidAmount || 0,
        pendingAmount: fee.pendingAmount || 0,
      };
    });

    const totalStudents = await Student.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalStudents / limitNum);

    res.status(200).json({
      success: true,
      message: "Students fee collection data retrieved successfully",
      data: {
        students: result,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStudents,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching students fee collection:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
