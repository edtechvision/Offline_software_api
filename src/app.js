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




async function updateOldPayments() {
  try {
    const fees = await Fee.find({ "paymentHistory.0": { $exists: true } }); // only fees with payment history

    for (let fee of fees) {
      let updated = false;

      fee.paymentHistory = fee.paymentHistory.map((entry) => {
        // Only update if missing collectedBy or inchargeCode
        if (!entry.collectedBy || !entry.inchargeCode) {
          updated = true;
          return {
            ...entry.toObject?.() || entry,
            collectedBy: "Incharge",
            inchargeCode: "TBINC20538",
          };
        }
        return entry;
      });

      if (updated) {
        await fee.save();
        console.log(`✅ Updated Fee: ${fee._id}`);
      }
    }

    console.log("🎉 Migration complete!");
  } catch (error) {
    console.error("❌ Error updating payment history:", error);
  }
}
// updateOldPayments()

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
