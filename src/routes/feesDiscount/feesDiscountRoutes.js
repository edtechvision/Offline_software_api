const express = require("express");
const router = express.Router();
const {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
} = require("../../controllers/feesDiscount/feesDiscountController");

router.post("/fees-discounts", createDiscount);     // Create new discount
router.get("/fees-discounts", getDiscounts);        // Get all discounts
router.get("/fees-discounts/:id", getDiscountById);      // Get single discount
router.put("/fees-discounts/:id", updateDiscount);   // Update discount
router.delete("/fees-discounts/:id", deleteDiscount);// Delete discount

module.exports = router;
