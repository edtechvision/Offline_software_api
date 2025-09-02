// controllers/feeController.js
const Fee = require("../../models/Fee");
const Student = require("../../models/Student");

// ✅ Create Fee Record for a Student
exports.createFee = async (req, res) => {
  try {
    const { studentId, totalFee, paidAmount, paymentMode, transactionId, remarks } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
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
      status: pendingAmount === 0 ? "Completed" : paidAmount > 0 ? "Partial" : "Pending",
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

exports.addPayment = async (req, res) => {
  try {
    const { feeId, amount, paymentMode, transactionId, remarks } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee record not found" });
    }

    // ✅ Previous received amount before this payment
    const previousReceivedAmount = fee.paidAmount || 0;

    // ✅ Update payment totals
    fee.paidAmount += amount;
    fee.pendingAmount = Math.max(0, fee.totalFee - fee.paidAmount);

    // ✅ Add payment history with previousReceivedAmount & receiptNo
    fee.paymentHistory.push({
      amount,
      previousReceivedAmount,
      pendingAmountAfterPayment: fee.pendingAmount, // ✅ Corrected
      paymentMode,
      transactionId,
      remarks,
      receiptNo: generateReceiptNo(),
    });

    // ✅ Update status
    if (fee.pendingAmount === 0) {
      fee.status = "Completed";
    } else if (fee.paidAmount > 0) {
      fee.status = "Partial";
    } else {
      fee.status = "Pending";
    }

    const updatedFee = await fee.save();

    res.status(200).json({
      success: true,
      message: "Payment added successfully",
      data: updatedFee,
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


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

exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ studentId })
      .populate("studentId", "-__v -qrCode -presentAddress -permanentAddress -courseDetails") // ✅ exclude qrCode
      .populate("courseId", "name fee") // keep course limited
      .populate("batchId", "batchName"); // keep batch limited

    if (!fees || fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No fee records found for this student",
      });
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

    const fee = await Fee.findById(feeId).populate("studentId", "studentName registrationNo"); // optional populate
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee record not found" });
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

exports.getAllPayments = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate("studentId", "studentName registrationNo className")
      .populate("courseId", "name")
      .populate("batchId", "batchName");

    if (!fees || fees.length === 0) {
      return res.status(404).json({ success: false, message: "No payments found" });
    }

    // Flatten payment history with student & course info
    const allPayments = fees.flatMap((fee) =>
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

    res.status(200).json({
      success: true,
      message: "All payments fetched successfully",
      totalPayments: allPayments.length,
      data: allPayments,
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
      return res.status(404).json({ success: false, message: "Fee record not found" });
    }

    // ✅ Find payment by receiptNo
    const paymentIndex = fee.paymentHistory.findIndex(
      (p) => p.receiptNo === receiptNo
    );

    if (paymentIndex === -1) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    // ✅ Get payment to delete
    const paymentToDelete = fee.paymentHistory[paymentIndex];

    // ✅ Deduct from totals
    fee.paidAmount = Math.max(0, fee.paidAmount - paymentToDelete.amount);
    fee.pendingAmount = Math.max(0, fee.totalFee - fee.paidAmount);

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

    const updatedFee = await fee.save();

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
      .populate("studentId", "studentName registrationNo mobileNumber")
      .populate("courseId", "name");

    if (!fees || fees.length === 0) {
      return res.status(404).json({ success: false, message: "No pending fees found" });
    }

    const pendingFeesList = fees.map((fee) => ({
      studentId: fee.studentId?._id,
      studentName: fee.studentId?.studentName,
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
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      batchId,         // ✅ new filter
      courseId,         // ✅ new filter
      className        // ✅ new filter
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search + filter query
    const searchQuery = {};
    
    // Apply search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
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
        { 'presentAddress.city': searchRegex },
        { 'presentAddress.state': searchRegex }
      ];
    }

    // ✅ Apply batch filter
    if (batchId) {
      searchQuery["courseDetails.batchId"] = batchId;
    }
    if (courseId) {
      searchQuery["courseDetails.courseId"] = courseId;
    }

    // ✅ Apply class filter
    if (className) {
      searchQuery["className"] = className;
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const students = await Student.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .populate("courseDetails.courseId", "name fee")
      .populate("courseDetails.additionalCourseId", "name")
      .populate("courseDetails.batchId", "batchName")
      .populate("centerId", "centerName centerHeadName");
    // Get total count for pagination info
    const totalStudents = await Student.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalStudents / limitNum);

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        students,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStudents,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};