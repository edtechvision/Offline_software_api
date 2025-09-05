const mongoose = require("mongoose");

// Helper function to generate receipt number
function generateReceiptNo() {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `TBREC${randomNum}`;
}

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },
    totalFee: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
     totalDiscount: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      default: function () {
        return this.totalFee;
      },
    },
    paymentHistory: [
      {
        amount: Number,
                fine: { type: Number, default: 0 }, // ✅ Fine added
        discountCode: { type: String }, // ✅ Discount code
        discountAmount: { type: Number, default: 0 }, // ✅ Discount amount
    discountFile: { type: String }, // ✅ URL of uploaded file

        previousReceivedAmount: { type: Number, default: 0 }, // ✅ new field
    pendingAmountAfterPayment: { type: Number, default: 0 }, // ✅ new field

        paymentDate: { type: Date, default: Date.now },
        paymentMode: { type: String, enum: ["Cash", "UPI", "Bank", "Card"] },
        transactionId: String,
        referenceNumber: String,
        remarks: String,
        receiptNo: { type: String, default: generateReceiptNo }, // Receipt No
      },
    ],
    nextPaymentDueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "Partial", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);
