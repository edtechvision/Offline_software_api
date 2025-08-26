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
const Center = require("./models/Center");
const Course = require("./models/Course");
const mongoose = require("mongoose");

async function addBlockField() {

  await Center.updateMany(
    { isBlocked: { $exists: false } },  // only update docs without field
    { $set: { isBlocked: false } }
  );

  console.log("✅ Added isBlocked field to all existing centers.");
  // mongoose.disconnect();
}

// addBlockField();

async function addIsActiveField() {

  await Course.updateMany(
    { isActive: { $exists: false } }, // only if missing
    { $set: { isActive: true } }
  );

  console.log("✅ Added isActive field to all existing courses.");
  // mongoose.disconnect();
}

// addIsActiveField();
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
