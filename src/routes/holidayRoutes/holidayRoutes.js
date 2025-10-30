const express = require("express");
const router = express.Router();
const holidayController = require("../../controllers/holidayController/holidayController");

router.post("/holidays", holidayController.addHoliday);
router.get("/holidays", holidayController.getHolidays);
router.put("/holidays/:id", holidayController.updateHoliday);
router.delete("/holidays/:id", holidayController.deleteHoliday);

module.exports = router;
