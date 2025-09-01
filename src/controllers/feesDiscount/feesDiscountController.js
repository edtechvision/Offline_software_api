const FeesDiscount = require("../../models/FeesDiscount");

// Create discount
// Utility: Standardized response handler
const sendResponse = (res, statusCode, success, message, data = null) => {
  res.status(statusCode).json({ success, message, data });
};
// CREATE Discount
exports.createDiscount = async (req, res) => {
  try {
    const { name, discountCode, discountType, percentage, amount, description } = req.body;

    if (!name || !discountCode || !discountType) {
      return sendResponse(res, 400, false, "Name, discountCode, and discountType are required.");
    }

    if (discountType === "percentage" && (percentage <= 0 || percentage > 100)) {
      return sendResponse(res, 400, false, "Percentage must be between 1 and 100.");
    }

    if (discountType === "fixed" && amount <= 0) {
      return sendResponse(res, 400, false, "Amount must be greater than 0.");
    }

    const existing = await FeesDiscount.findOne({ discountCode });
    if (existing) {
      return sendResponse(res, 409, false, "Discount code already exists.");
    }

    const discount = await FeesDiscount.create({
      name,
      discountCode,
      discountType,
      percentage: discountType === "percentage" ? percentage : 0,
      amount: discountType === "fixed" ? amount : 0,
      description,
    });

    return sendResponse(res, 201, true, "Discount created successfully", discount);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", error.message);
  }
};

// GET ALL Discounts
exports.getDiscounts = async (req, res) => {
  try {
    const discounts = await FeesDiscount.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, true, "Discounts retrieved successfully", discounts);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", error.message);
  }
};

// GET Discount by ID
exports.getDiscountById = async (req, res) => {
  try {
    const discount = await FeesDiscount.findById(req.params.id);
    if (!discount) {
      return sendResponse(res, 404, false, "Discount not found");
    }
    return sendResponse(res, 200, true, "Discount retrieved successfully", discount);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", error.message);
  }
};

// UPDATE Discount
exports.updateDiscount = async (req, res) => {
  try {
    const { name, discountType, percentage, amount, description } = req.body;

    const discount = await FeesDiscount.findById(req.params.id);
    if (!discount) {
      return sendResponse(res, 404, false, "Discount not found");
    }

    if (discountType) {
      if (discountType === "percentage" && (percentage <= 0 || percentage > 100)) {
        return sendResponse(res, 400, false, "Percentage must be between 1 and 100.");
      }
      if (discountType === "fixed" && amount <= 0) {
        return sendResponse(res, 400, false, "Amount must be greater than 0.");
      }
    }

    // Update fields
    discount.name = name ?? discount.name;
    discount.discountType = discountType ?? discount.discountType;
    discount.percentage = discountType === "percentage" ? percentage : 0;
    discount.amount = discountType === "fixed" ? amount : 0;
    discount.description = description ?? discount.description;

    await discount.save();

    return sendResponse(res, 200, true, "Discount updated successfully", discount);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", error.message);
  }
};

// DELETE Discount
exports.deleteDiscount = async (req, res) => {
  try {
    const discount = await FeesDiscount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return sendResponse(res, 404, false, "Discount not found");
    }
    return sendResponse(res, 200, true, "Discount deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", error.message);
  }
};