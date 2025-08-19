// routes/centerRoutes.js
const express = require('express');
const { createCenter } = require('../../controllers/centre/centerController');

const router = express.Router();

router.post('/create', createCenter);

module.exports = router;
