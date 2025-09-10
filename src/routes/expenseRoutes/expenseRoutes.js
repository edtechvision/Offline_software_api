const express = require("express");
const router = express.Router();
const multer = require("multer");
const expenseController = require("../../controllers/expenseController/expenseController");

// multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/expenses",
  upload.single("file"),
  expenseController.createExpense
);
router.get("/expenses", expenseController.getExpenses);
router.get("/expenses/:id", expenseController.getExpenseById);

router.delete("/expenses/:id", expenseController.deleteExpense);
// // Update status (paid/unpaid)
router.put("/:id/status", expenseController.updateExpenseStatus);
// // Toggle approval (true <-> false)
router.put("/:id/toggle-approval", expenseController.toggleApproval);

module.exports = router;
