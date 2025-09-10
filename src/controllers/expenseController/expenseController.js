const Expense = require("../../models/Expense");
const s3 = require("../../utils/s3");

const { v4: uuidv4 } = require("uuid");

// Upload File to DigitalOcean Spaces
const uploadFileToS3 = async (file) => {
  const fileKey = `expenses/${uuidv4()}-${file.originalname}`;

  const params = {
    Bucket: process.env.DO_SPACE_BUCKET, // your space name
    Key: fileKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  await s3.upload(params).promise();

  return `https://${process.env.DO_SPACE_BUCKET}.blr1.digitaloceanspaces.com/${fileKey}`;
};

// @desc Create Expense
exports.createExpense = async (req, res) => {
  try {
    let fileUrl = null;
    if (req.file) {
      fileUrl = await uploadFileToS3(req.file);
    }

    const expense = new Expense({
      expenseHead: req.body.expenseHead,
      amount: req.body.amount,
      file: fileUrl,
      details: req.body.details,
    });

    await expense.save();

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change payment status (paid/unpaid)
exports.updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params; // Expense ID from URL
    const { status, paidDate } = req.body; // status = "paid" | "unpaid"

    if (!["paid", "unpaid"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        status,
        paidDate: status === "paid" ? paidDate || new Date() : null,
      },
      { new: true }
    );

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle approve/unapprove
exports.toggleApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    // Flip the boolean
    expense.isApproved = !expense.isApproved;
    await expense.save();

    res.status(200).json({
      success: true,
      message: `Expense is now ${
        expense.isApproved ? "approved" : "unapproved"
      }`,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
