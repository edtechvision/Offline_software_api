const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDb = require("./db/db.config");

const app = express();
app.use(cors());
// Increase payload size limit (e.g., 50MB)
// Increase JSON body size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static("uploads"));
const Student = require("./models/Student");
const { createLog } = require("./helpers/logger");
const Fee = require("./models/Fee");

async function backfillFeeLogs() {
  try {
    const fees = await Fee.find({});
    console.log(`Found ${fees.length} fee records.`);

    for (const fee of fees) {
      await createLog({
        action: "FEE_CREATED",
        user: "Incharge", // distinguish old logs
        inchargeCode: fee.paymentHistory?.[0]?.inchargeCode || "Unknown",
        details: {
          studentId: fee.studentId,
          courseId: fee.courseId,
          batchId: fee.batchId,
          paidAmount: fee.paidAmount,
          pendingAmount: fee.pendingAmount,
          discountApplied: fee.totalDiscount,
          status: fee.status,
        },
      });
      console.log(`Log created for fee record: ${fee._id}`);
    }

    console.log("🎉 Fee logs backfill complete!");
    return { success: true, message: "Logs created for existing fees" };
  } catch (err) {
    console.error("❌ Error in backfillFeeLogs:", err);
    return { success: false, message: err.message };
  }
}



// backfillFeeLogs();
const routes = require("./routes/index");

app.use(routes);

// updateOldTemplates();
const port = process.env.PORT || 5000;
connectDb()
  .then(function () {
    console.log("Connected to database");
    app.listen(port || 4000, () => console.log(`Listening on port ${port}`));
  })
  .catch(function (err) {
    console.error("Error connecting to database", err);
  });
