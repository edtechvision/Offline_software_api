const Fee = require("../models/Fee");

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
async function createFeeRecord(student, courseDetails) {
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
    discountFile,
  } = courseDetails;

  // Normalize empty strings → null
  if (transactionId === "") transactionId = null;
  if (additionalCourseId === "") additionalCourseId = null;
  if (referenceNumber === "") referenceNumber = null;

  // ✅ EMI validation
  if (paymentType === "EMI" && (!downPayment || !nextPaymentDueDate)) {
    throw new Error("For EMI, downPayment and nextPaymentDueDate are required");
  }

  // ✅ PaymentMode validation
  if (paymentMode === "UPI" && !transactionId) {
    throw new Error("Transaction Id required for UPI payments");
  }

  // ✅ Fee calculation with discount
  const totalFee = Number(courseFee) || 0;
  const effectiveFee = totalFee - Number(discountAmount || 0); // subtract discount
  if (effectiveFee < 0) {
    throw new Error("Discount cannot exceed total course fee");
  }

  const paidAmount =
    paymentType === "Full-Payment" ? effectiveFee : Number(downPayment) || 0;

  if (paidAmount > effectiveFee) {
    throw new Error(
      "Down payment cannot be greater than total course fee after discount"
    );
  }

  const pendingAmount = effectiveFee - paidAmount;

  const fee = new Fee({
    studentId: student._id,
    courseId,
    batchId,
    totalFee,
    paidAmount,
    pendingAmount,
    discountCode,
    discountAmount,
    discountFile,
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
              referenceNumber,
              discountCode,
              discountAmount,
              discountFile,
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

  return await fee.save();
}

module.exports = createFeeRecord;
