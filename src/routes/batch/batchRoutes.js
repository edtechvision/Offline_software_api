// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const batchController = require('../../controllers/Batch/batchController');


router.post('/batches', batchController.createBatch);
router.get('/batches', batchController.getAllBatches);
router.get('/batches/staff', batchController.getAllActiveBatchesForStaff);

router.get('/batches/:id', batchController.getBatchById);
router.put('/batches/:id', batchController.updateBatchName);
router.patch('/batches/:id/toggle-status', batchController.updateBatchStatus);
router.delete('/batches/:id', batchController.deleteBatch);


module.exports = router;
