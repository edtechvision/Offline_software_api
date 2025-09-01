const mongoose = require("mongoose");

const feesDiscountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  discountCode: {
    type: String,
    required: true,
    unique: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("FeesDiscount", feesDiscountSchema);
