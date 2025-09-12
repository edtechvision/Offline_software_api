const express = require("express");
const router = express.Router();
const logsController = require("../../controllers/logs/logsController");

router.get("/get-logs", logsController.getLogs); // Create new discount

module.exports = router;
