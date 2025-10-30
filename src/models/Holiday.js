const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true, // prevent duplicate holidays for same day
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", HolidaySchema);
