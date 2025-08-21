// routes/centerRoutes.js
const express = require('express');
const { createCenter,getCenters } = require('../../controllers/centre/centerController');

const router = express.Router();

router.post('/center/create', createCenter);
router.get('/center/get', getCenters);

module.exports = router;
