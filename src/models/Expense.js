const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    expenseHead: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    file: {
      type: String, // store file path or URL
    },
    details: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    paidDate: {
      type: Date,
    },
    isApproved: {
      type: Boolean,
      default: false, // initially false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
