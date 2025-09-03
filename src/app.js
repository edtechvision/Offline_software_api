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
app.use('/uploads', express.static('uploads'));
const Student = require("./models/Student");

async function addIsActiveFieldToExistingStudents() {
  try {
    const result = await Student.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: false } }
    );
    console.log(`Updated ${result.modifiedCount} students with isActive field.`);
  } catch (error) {
    console.error('Error updating students:', error);
  }
}

// addIsActiveFieldToExistingStudents()

// addIsActiveField();
const Fee = require("./models/Fee");



async function fixFeeRecords() {

  const fees = await Fee.find({});
  for (const fee of fees) {
    // ✅ Recalculate paidAmount from payment history
    const totalPaid = fee.paymentHistory.reduce(
      (sum, p) => sum + Number(p.amount || 0) + Number(p.fine || 0),
      0
    );

    fee.paidAmount = totalPaid;
    fee.pendingAmount = Math.max(0, fee.totalFee - totalPaid);

    // ✅ Fix status
    if (fee.pendingAmount === 0) {
      fee.status = "Completed";
    } else if (fee.paidAmount > 0) {
      fee.status = "Partial";
    } else {
      fee.status = "Pending";
    }

    await fee.save();
    console.log(`Fixed Fee ID: ${fee._id}, Paid: ${fee.paidAmount}, Pending: ${fee.pendingAmount}`);
  }

  
}

// fixFeeRecords().catch(err => {
//   console.error("Migration failed:", err);
// });




async function fixPaidAmounts() {
  try {
  
    console.log("✅ Connected to MongoDB");

    const fees = await Fee.find({});
    let fixedCount = 0;

    for (const fee of fees) {
      let updated = false;

      // 🔹 Force paidAmount to Number
      if (typeof fee.paidAmount === "string") {
        fee.paidAmount = Number(fee.paidAmount) || 0;
        updated = true;
      }

      // 🔹 Force pendingAmount to Number
      if (typeof fee.pendingAmount === "string") {
        fee.pendingAmount = Number(fee.pendingAmount) || 0;
        updated = true;
      }

      // 🔹 Also fix inside paymentHistory
      fee.paymentHistory = fee.paymentHistory.map((p) => {
        let changed = false;
        const updatedPayment = { ...p._doc };

        if (typeof updatedPayment.amount === "string") {
          updatedPayment.amount = Number(updatedPayment.amount) || 0;
          changed = true;
        }
        if (typeof updatedPayment.fine === "string") {
          updatedPayment.fine = Number(updatedPayment.fine) || 0;
          changed = true;
        }
        if (typeof updatedPayment.discountAmount === "string") {
          updatedPayment.discountAmount = Number(updatedPayment.discountAmount) || 0;
          changed = true;
        }
        if (typeof updatedPayment.previousReceivedAmount === "string") {
          updatedPayment.previousReceivedAmount = Number(updatedPayment.previousReceivedAmount) || 0;
          changed = true;
        }
        if (typeof updatedPayment.pendingAmountAfterPayment === "string") {
          updatedPayment.pendingAmountAfterPayment = Number(updatedPayment.pendingAmountAfterPayment) || 0;
          changed = true;
        }

        return changed ? updatedPayment : p;
      });

      if (updated) {
        await fee.save();
        fixedCount++;
        console.log(`🔧 Fixed Fee ID: ${fee._id}`);
      }
    }

    console.log(`\n✅ Finished. Fixed ${fixedCount} records.`);
  } catch (err) {
    console.error("❌ Error fixing paidAmount:", err);
    process.exit(1);
  }
}

// fixPaidAmounts();

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
