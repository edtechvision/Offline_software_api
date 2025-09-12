const Fee = require("../models/Fee");
const s3 = require("../utils/s3");
const { createLog } = require("./logger");

// Helper function to generate receipt number
function generateReceiptNo() {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `TBREC${randomNum}`;
}

/**
 * Create and save a fee record for a student
 * @param {Object} student - Saved student object
 * @param {Object} courseDetails - Course & payment details from request body
 * @returns {Object} Saved Fee document
 */

// async function createFeeRecord(student, courseDetails, file,inchargeCode) {
//   if (!courseDetails || !courseDetails.courseId) {
//     throw new Error("Course is required. Please select a course.");
//   }

//   let {
//     courseId,
//     batchId,
//     courseFee,
//     paymentType,
//     downPayment,
//     nextPaymentDueDate,
//     paymentMode,
//     transactionId,
//     additionalCourseId,
//     referenceNumber,
//     discountCode,
//     discountAmount = 0,
//   } = courseDetails;

//   // Normalize empty strings → null
//   if (transactionId === "") transactionId = null;
//   if (additionalCourseId === "") additionalCourseId = null;
//   if (referenceNumber === "") referenceNumber = null;

//   // ✅ EMI validation
//   if (paymentType === "EMI" && (!downPayment || !nextPaymentDueDate)) {
//     throw new Error("For EMI, downPayment and nextPaymentDueDate are required");
//   }

//   // ✅ PaymentMode validation
// //   if (paymentMode === "UPI" && !transactionId) {
// //     throw new Error("Transaction Id required for UPI payments");
// //   }

//   // ✅ Upload discount file if provided
//   let discountFileUrl = null;
//   if (file) {
//     const params = {
//       Bucket: process.env.DO_SPACE_BUCKET,
//       Key: `discounts/${Date.now()}_${file.originalname}`,
//       Body: file.buffer,
//       ACL: "public-read",
//       ContentType: file.mimetype,
//     };
//     const uploaded = await s3.upload(params).promise();
//     discountFileUrl = uploaded.Location;
//   }

//   // ✅ Fee calculation
//   const totalFee = Number(courseFee) || 0;
//   const initialDiscount = Number(discountAmount) || 0;
//   if (initialDiscount > totalFee) {
//     throw new Error("Discount cannot exceed total course fee");
//   }

//   const paidAmount =
//     paymentType === "Full-Payment"
//       ? totalFee - initialDiscount
//       : Number(downPayment) || 0;

//   if (paidAmount > totalFee - initialDiscount) {
//     throw new Error("Down payment cannot be greater than net course fee");
//   }

//   const pendingAmount = totalFee - (paidAmount + initialDiscount);

//   const fee = new Fee({
//     studentId: student._id,
//     courseId,
//     batchId,
//     totalFee,
//     paidAmount, // strictly student-paid amount
//     pendingAmount,
//     totalDiscount: initialDiscount, // ✅ keep consistent with addPayment
//     discountCode,
//     discountFile: discountFileUrl,
//     nextPaymentDueDate: paymentType === "EMI" ? nextPaymentDueDate : null,
//     status:
//       pendingAmount === 0 ? "Completed" : paidAmount > 0 ? "Partial" : "Pending",
//     paymentHistory:
//       paidAmount > 0 || initialDiscount > 0
//         ? [
//             {
//               amount: paidAmount,
//               fine: 0,
//               discountCode,
//               discountAmount: initialDiscount,
//               discountFile: discountFileUrl,
//               previousReceivedAmount: 0,
//               pendingAmountAfterPayment: pendingAmount,
//               paymentMode,
//               transactionId,
//               referenceNumber,
//               remarks:
//                 paymentType === "Full-Payment"
//                   ? "Full Payment at Admission"
//                   : paidAmount > 0
//                   ? "Down Payment at Admission"
//                   : "Discount Applied",
//               receiptNo: generateReceiptNo(),
//               paymentDate: Date.now(),
//               collectedBy: "Incharge",
//               inchargeCode,
//             },
//           ]
//         : [],
//   });

//   return await fee.save();
// }

async function createFeeRecord(student, courseDetails, file, inchargeCode) {
  if (!courseDetails || !courseDetails.courseId) {
    throw new Error("Course is required. Please select a course.");
  }

  let {
    courseId,
    batchId,
    courseFee,
    paymentType,
    downPayment,
    nextPaymentDueDate,
    paymentMode,
    transactionId,
    additionalCourseId,
    referenceNumber,
    discountCode,
    discountAmount = 0,
  } = courseDetails;

  // Normalize empty strings → null
  if (transactionId === "") transactionId = null;
  if (additionalCourseId === "") additionalCourseId = null;
  if (referenceNumber === "") referenceNumber = null;

  // ✅ EMI validation
  if (paymentType === "EMI" && (!downPayment || !nextPaymentDueDate)) {
    throw new Error("For EMI, downPayment and nextPaymentDueDate are required");
  }

  // ✅ Upload discount file if provided
  let discountFileUrl = null;
  if (file) {
    const params = {
      Bucket: process.env.DO_SPACE_BUCKET,
      Key: `discounts/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ACL: "public-read",
      ContentType: file.mimetype,
    };
    const uploaded = await s3.upload(params).promise();
    discountFileUrl = uploaded.Location;
  }

  // ✅ Fee calculation
  const totalFee = Number(courseFee) || 0;
  const initialDiscount = Number(discountAmount) || 0;
  if (initialDiscount > totalFee) {
    throw new Error("Discount cannot exceed total course fee");
  }

  const paidAmount =
    paymentType === "Full-Payment"
      ? totalFee - initialDiscount
      : Number(downPayment) || 0;

  if (paidAmount > totalFee - initialDiscount) {
    throw new Error("Down payment cannot be greater than net course fee");
  }

  const pendingAmount = totalFee - (paidAmount + initialDiscount);

  const fee = new Fee({
    studentId: student._id,
    courseId,
    batchId,
    totalFee,
    paidAmount,
    pendingAmount,
    totalDiscount: initialDiscount,
    discountCode,
    discountFile: discountFileUrl,
    nextPaymentDueDate: paymentType === "EMI" ? nextPaymentDueDate : null,
    status:
      pendingAmount === 0
        ? "Completed"
        : paidAmount > 0
        ? "Partial"
        : "Pending",
    paymentHistory:
      paidAmount > 0 || initialDiscount > 0
        ? [
            {
              amount: paidAmount,
              fine: 0,
              discountCode,
              discountAmount: initialDiscount,
              discountFile: discountFileUrl,
              previousReceivedAmount: 0,
              pendingAmountAfterPayment: pendingAmount,
              paymentMode,
              transactionId,
              referenceNumber,
              remarks:
                paymentType === "Full-Payment"
                  ? "Full Payment at Admission"
                  : paidAmount > 0
                  ? "Down Payment at Admission"
                  : "Discount Applied",
              receiptNo: generateReceiptNo(),
              paymentDate: Date.now(),
              collectedBy: "Incharge",
              inchargeCode,
            },
          ]
        : [],
  });

  // ✅ Save the fee
  const savedFee = await fee.save();

  // ✅ Async-safe log
  createLog({
    action: "FEE_CREATED",
    user: "Incharge", // replace with req.user if available
    inchargeCode,
    details: {
      studentId: student._id,
      courseId,
      batchId,
      paidAmount,
      pendingAmount,
      discountApplied: initialDiscount,
      status: savedFee.status,
    },
  }).catch((err) => {
    console.error("Log creation failed:", err.message);
  });

  return savedFee;
}

module.exports = createFeeRecord;
