// utils/logger.js

const Log = require("../models/Log");

async function createLog({
  action,
  user,
  inchargeCode,
  details = {},
  status = "SUCCESS",
  error = null,
}) {
  try {
    await Log.create({
      action,
      user,
      inchargeCode,
      details,
      status,
      error,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to save log:", err.message);
  }
}

module.exports = { createLog };
