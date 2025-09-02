const AWS = require('aws-sdk');


const Student = require('../../models/Student');
const QRCode = require("qrcode");
const s3 = require("../../utils/s3");
const { v4: uuidv4 } = require("uuid");
const Fee = require('../../models/Fee');

const {
  parseJsonField,
  generateRegistrationNo,
  uploadImage,
  deleteImage,
  generateQRCode,
} = require("./studentUtils");
const Center = require('../../models/Center');

function generateReceiptNo() {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `TBREC${randomNum}`;
}


exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // ✅ Check if center exists
    const center = await Center.findOne({ centerCode: studentData.centerCode });
    if (!center) {
      return res.status(400).json({
        success: false,
        message: "Invalid centerCode. Center not found.",
      });
    }

    // attach centerId to studentData for relational reference
    studentData.centerId = center._id;

    // Generate registration number
    studentData.registrationNo = await generateRegistrationNo(
      Student,
      studentData.className
    );

    // Required fields validation
    const requiredFields = [
       "centerCode",
      "inchargeCode",
      "inchargeName",
      "studentName",
      "fathersName",
      "mothersName",
      "dateOfBirth",
      "category",
      "nationality",
      "gender",
      "email",
      "mobileNumber",
      "adharNumber",
      "collegeName",
      "className",
    ];

    const missingFields = requiredFields.filter((f) => !studentData[f]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Parse JSON fields
    try {
      studentData.presentAddress = parseJsonField(studentData.presentAddress, "presentAddress");
      studentData.permanentAddress = parseJsonField(studentData.permanentAddress, "permanentAddress");
      studentData.courseDetails = parseJsonField(studentData.courseDetails, "courseDetails");
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (studentData.isPermanentSameAsPresent) {
      studentData.permanentAddress = { ...studentData.presentAddress };
    }

    // Upload image if provided
    if (req.file) {
      try {
        const { image } = await uploadImage(req.file);
        studentData.image = image;
      } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to upload image" });
      }
    }

    // Generate QR code
    try {
      studentData.qrCode = await generateQRCode(studentData.registrationNo);
      studentData.qrCodeData = studentData.registrationNo;
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to generate QR Code" });
    }

    // Save student
    const student = new Student(studentData);
    const savedStudent = await student.save();

    // Handle fees if courseDetails exists
    if (studentData.courseDetails) {
      const {
        courseId,
        batchId,
        courseFee,
        paymentType,
        downPayment,
        nextPaymentDueDate,
        paymentMode,
        transactionId,
      } = studentData.courseDetails;

      if (paymentType === "EMI" && (!downPayment || !nextPaymentDueDate)) {
        return res.status(400).json({
          success: false,
          message: "For EMI, downPayment and nextPaymentDueDate are required",
        });
      }

      if (paymentMode === "UPI" && !transactionId) {
        return res.status(400).json({ success: false, message: "Transaction Id required" });
      }

      const paidAmount = paymentType === "Full-Payment" ? courseFee : (downPayment || 0);
      const pendingAmount = courseFee - paidAmount;

      const fee = new Fee({
        studentId: savedStudent._id,
        courseId,
        batchId,
        totalFee: courseFee,
        paidAmount,
        pendingAmount,
        nextPaymentDueDate: paymentType === "EMI" ? nextPaymentDueDate : null,
        status:
          pendingAmount === 0 ? "Completed" : paidAmount > 0 ? "Partial" : "Pending",
        paymentHistory:
          paidAmount > 0
            ? [
                {
                  amount: paidAmount,
                  paymentMode,
                  transactionId,
                 pendingAmountAfterPayment: pendingAmount,
                   receiptNo: generateReceiptNo(),
                  remarks:
                    paymentType === "Full-Payment"
                      ? "Full Payment at Admission"
                      : "Down Payment at Admission",
                },
              ]
            : [],
      });

      await fee.save();
    }

    res.status(201).json({ success: true, message: "Student created", data: savedStudent });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Student with this Aadhar exists" });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




// ✅ UPDATE STUDENT
// exports.updateStudent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const existingStudent = await Student.findById(id);
//     if (!existingStudent) {
//       return res.status(404).json({ success: false, message: "Student not found" });
//     }

//     // Parse JSON fields safely
//     try {
//       updateData.presentAddress = parseJsonField(updateData.presentAddress, "presentAddress", existingStudent.presentAddress);
//       updateData.permanentAddress = parseJsonField(updateData.permanentAddress, "permanentAddress", existingStudent.permanentAddress);
//       updateData.courseDetails = parseJsonField(updateData.courseDetails, "courseDetails", existingStudent.courseDetails);
//     } catch (err) {
//       return res.status(400).json({ success: false, message: err.message });
//     }

//     if (updateData.isPermanentSameAsPresent) {
//       updateData.permanentAddress = updateData.presentAddress || existingStudent.presentAddress;
//     }

//     // Regenerate registration no if className changes
//     if (updateData.className && updateData.className !== existingStudent.className) {
//       updateData.registrationNo = await generateRegistrationNo(Student, updateData.className);
//     }

//     // Validate email
//     if (updateData.email) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(updateData.email)) {
//         return res.status(400).json({ success: false, message: "Invalid email format" });
//       }
//     }

//     // Handle image replacement
//     if (req.file) {
//       if (existingStudent.image) {
//         const key = existingStudent.image.split("/").slice(3).join("/");
//         await deleteImage(key);
//       }
//       try {
//         const { image } = await uploadImage(req.file);
//         updateData.image = image;
//       } catch (err) {
//         return res.status(500).json({ success: false, message: "Failed to upload image" });
//       }
//     }

//     // Handle course + fee update
//     if (updateData.courseDetails) {
//       const {
//         courseId,
//         batchId,
//         courseFee,
//         paymentType,
//         downPayment,
//         nextPaymentDueDate,
//         paymentMode,
//         transactionId,
//       } = updateData.courseDetails;

//       // Validation
//       if (paymentType === "EMI" && (!downPayment || !nextPaymentDueDate)) {
//         return res.status(400).json({
//           success: false,
//           message: "For EMI, downPayment and nextPaymentDueDate are required",
//         });
//       }
//       if (paymentMode === "UPI" && !transactionId) {
//         return res.status(400).json({ success: false, message: "Transaction Id required" });
//       }

//       // Fetch existing fee record
//       let fee = await Fee.findOne({ studentId: existingStudent._id });

//       if (!fee) {
//         // Edge case: no fee yet → create one
//         const paidAmount = paymentType === "Full-Payment" ? courseFee : (downPayment || 0);
//         const pendingAmount = courseFee - paidAmount;

//         fee = new Fee({
//           studentId: existingStudent._id,
//           courseId,
//           batchId,
//           totalFee: courseFee,
//           paidAmount,
//           pendingAmount,
//           nextPaymentDueDate: paymentType === "EMI" ? nextPaymentDueDate : null,
//           status:
//             pendingAmount === 0 ? "Completed" : paidAmount > 0 ? "Partial" : "Pending",
//           paymentHistory:
//             paidAmount > 0
//               ? [
//                   {
//                     amount: paidAmount,
//                     paymentMode,
//                     transactionId,
//                      receiptNo: generateReceiptNo(),
//                     remarks:
//                       paymentType === "Full-Payment"
//                         ? "Full Payment at Admission"
//                         : "Down Payment at Admission",
//                   },
//                 ]
//               : [],
//         });
//       } else {
//         // Overwrite/update the same Fee record
//         fee.courseId = courseId || fee.courseId;
//         fee.batchId = batchId || fee.batchId;
//         fee.totalFee = courseFee || fee.totalFee;

//         // Recalculate amounts if fee or paymentType changed
//         if (courseFee) {
//           const paidAmount =
//             paymentType === "Full-Payment" ? courseFee : fee.paidAmount;
//           fee.paidAmount = paidAmount;
//           fee.pendingAmount = courseFee - paidAmount;
//         }

//         // Append new payment if provided
//         if (downPayment || transactionId) {
//           fee.paymentHistory.push({
//             amount: downPayment || 0,
//             paymentMode,
//             transactionId,
//            receiptNo: generateReceiptNo(),
//             remarks:
//               paymentType === "Full-Payment"
//                 ? "Full Payment (Updated)"
//                 : "Additional Payment during Update",
//           });
//           fee.paidAmount += downPayment || 0;
//           fee.pendingAmount = fee.totalFee - fee.paidAmount;
//         }

//         // Update status
//         fee.status =
//           fee.pendingAmount === 0
//             ? "Completed"
//             : fee.paidAmount > 0
//             ? "Partial"
//             : "Pending";

//         // Update EMI due date if relevant
//         if (paymentType === "EMI" && nextPaymentDueDate) {
//           fee.nextPaymentDueDate = nextPaymentDueDate;
//         }
//       }

//       await fee.save();
//     }

//     // Regenerate QR if regNo changed
//     if (updateData.registrationNo && updateData.registrationNo !== existingStudent.registrationNo) {
//       try {
//         updateData.qrCode = await generateQRCode(updateData.registrationNo);
//         updateData.qrCodeData = updateData.registrationNo;
//       } catch {
//         return res.status(500).json({ success: false, message: "Failed to generate QR Code" });
//       }
//     }

//     const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({ success: true, message: "Student updated", data: updatedStudent });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ success: false, message: "Student with this Aadhar exists" });
//     }
//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((e) => e.message);
//       return res.status(400).json({ success: false, message: "Validation failed", errors });
//     }
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Parse JSON fields safely
    try {
      updateData.presentAddress = parseJsonField(
        updateData.presentAddress,
        "presentAddress",
        existingStudent.presentAddress
      );
      updateData.permanentAddress = parseJsonField(
        updateData.permanentAddress,
        "permanentAddress",
        existingStudent.permanentAddress
      );
      updateData.courseDetails = parseJsonField(
        updateData.courseDetails,
        "courseDetails",
        existingStudent.courseDetails
      );
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (updateData.isPermanentSameAsPresent) {
      updateData.permanentAddress =
        updateData.presentAddress || existingStudent.presentAddress;
    }

    // Regenerate registration no if className changes
    if (
      updateData.className &&
      updateData.className !== existingStudent.className
    ) {
      updateData.registrationNo = await generateRegistrationNo(
        Student,
        updateData.className
      );
    }

    // Validate email
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }
    }

    // Handle image replacement
    if (req.file) {
      if (existingStudent.image) {
        const key = existingStudent.image.split("/").slice(3).join("/");
        await deleteImage(key);
      }
      try {
        const { image } = await uploadImage(req.file);
        updateData.image = image;
      } catch (err) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to upload image" });
      }
    }

    // Handle course + fee update ONLY if courseId changes
    if (
      updateData.courseDetails &&
      updateData.courseDetails.courseId &&
      updateData.courseDetails.courseId.toString() !==
        existingStudent.courseDetails?.courseId?.toString()
    ) {
      const {
        courseId,
        batchId,
        courseFee,
        paymentType,
        downPayment,
        nextPaymentDueDate,
        paymentMode,
        transactionId,
      } = updateData.courseDetails;

      // Validation
      if (paymentType === "EMI" && (!downPayment || !nextPaymentDueDate)) {
        return res.status(400).json({
          success: false,
          message: "For EMI, downPayment and nextPaymentDueDate are required",
        });
      }
      if (paymentMode === "UPI" && !transactionId) {
        return res
          .status(400)
          .json({ success: false, message: "Transaction Id required" });
      }

      // Either find existing fee or create fresh
      let fee = await Fee.findOne({ studentId: existingStudent._id });

      if (!fee) {
        // New fee record
        const paidAmount =
          paymentType === "Full-Payment" ? courseFee : downPayment || 0;
        const pendingAmount = courseFee - paidAmount;

        fee = new Fee({
          studentId: existingStudent._id,
          courseId,
          batchId,
          totalFee: courseFee,
          paidAmount,
          pendingAmount,
          nextPaymentDueDate:
            paymentType === "EMI" ? nextPaymentDueDate : null,
          status:
            pendingAmount === 0
              ? "Completed"
              : paidAmount > 0
              ? "Partial"
              : "Pending",
          paymentHistory:
            paidAmount > 0
              ? [
                  {
                    amount: paidAmount,
                    paymentMode,
                    transactionId,
                    receiptNo: generateReceiptNo(),
                    remarks:
                      paymentType === "Full-Payment"
                        ? "Full Payment at Admission"
                        : "Down Payment at Admission",
                  },
                ]
              : [],
        });
      } else {
        // Reset fee details for new course
        const paidAmount =
          paymentType === "Full-Payment" ? courseFee : downPayment || 0;
        const pendingAmount = courseFee - paidAmount;

        fee.courseId = courseId;
        fee.batchId = batchId;
        fee.totalFee = courseFee;
        fee.paidAmount = paidAmount;
        fee.pendingAmount = pendingAmount;
        fee.nextPaymentDueDate =
          paymentType === "EMI" ? nextPaymentDueDate : null;

        fee.paymentHistory =
          paidAmount > 0
            ? [
                {
                  amount: paidAmount,
                  paymentMode,
                  transactionId,
                  receiptNo: generateReceiptNo(),
                  remarks:
                    paymentType === "Full-Payment"
                      ? "Full Payment (New Course)"
                      : "Down Payment (New Course)",
                },
              ]
            : [];

        fee.status =
          pendingAmount === 0
            ? "Completed"
            : paidAmount > 0
            ? "Partial"
            : "Pending";
      }

      await fee.save();
    }

    // Regenerate QR if regNo changed
    if (
      updateData.registrationNo &&
      updateData.registrationNo !== existingStudent.registrationNo
    ) {
      try {
        updateData.qrCode = await generateQRCode(updateData.registrationNo);
        updateData.qrCodeData = updateData.registrationNo;
      } catch {
        return res
          .status(500)
          .json({ success: false, message: "Failed to generate QR Code" });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Student updated",
      data: updatedStudent,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Student with this Aadhar exists" });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


exports.getStudents = async (req, res) => {
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


exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find student by ID and populate related fields
    const student = await Student.findById(id)
      .select('-__v')
      .populate("courseDetails.courseId", "name fee")
      .populate("courseDetails.additionalCourseId", "name")
      .populate("courseDetails.batchId", "batchName");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student
    });

  } catch (error) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};




// ✅ Activate student
exports.activateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(
      id,
      { isActive: true, updatedAt: Date.now() },
      { new: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student activated successfully", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Deactivate student
exports.deactivateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student deactivated successfully", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};