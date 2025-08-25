// routes/centerRoutes.js
const express = require('express');
const { createCenter,getCenters,updateCenter,toggleBlockCenter,getCenterById,getCentersByStaff  } = require('../../controllers/centre/centerController');

const router = express.Router();

router.post('/center/create', createCenter);
router.get('/center/get', getCenters);
router.get('/center/incharge', getCentersByStaff);
router.get('/center/getById/:id', getCenterById);
router.get('/center/get', getCenters);
router.put('/centers/:id', updateCenter);
router.post('/centers/:centerId/block', toggleBlockCenter);



module.exports = router;
