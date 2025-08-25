const Batch = require('../../models/Batch');

// Create a new batch
exports.createBatch = async (req, res) => {
  try {
    const { batchName, isActive = true } = req.body;

    // Check if batch name already exists
    const existingBatch = await Batch.findOne({ batchName });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch name already exists'
      });
    }

    // Create new batch
    const batch = new Batch({
      batchName,
      isActive,
    });

    const savedBatch = await batch.save();

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: savedBatch
    });

  } catch (error) {
    console.error('Error creating batch:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all batches with pagination and search
exports.getAllBatches = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Parse parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.batchName = { $regex: search, $options: 'i' };
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const batches = await Batch.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
            .select('-__v');

    // Get total count
    const totalBatches = await Batch.countDocuments(query);
    const totalPages = Math.ceil(totalBatches / limitNum);

    res.status(200).json({
      success: true,
      message: 'Batches retrieved successfully',
      data: {
        batches,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalBatches,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get batch by ID
exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id)
      .select('-__v');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Batch retrieved successfully',
      data: batch
    });

  } catch (error) {
    console.error('Error fetching batch:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update batch
exports.updateBatchName = async (req, res) => {
  try {
    const { id } = req.params;
    const { batchName } = req.body;

    if (!batchName) {
      return res.status(400).json({
        success: false,
        message: 'Batch name is required'
      });
    }

    // Check if batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if new batchName already exists
    const existingBatch = await Batch.findOne({ batchName });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch name already exists'
      });
    }

    batch.batchName = batchName;
    const updatedBatch = await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch name updated successfully',
      data: updatedBatch
    });

  } catch (error) {
    console.error('Error updating batch name:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};



// Toggle batch active status
exports.updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required'
      });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    batch.isActive = isActive;
    const updatedBatch = await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch status updated successfully',
      data: updatedBatch
    });

  } catch (error) {
    console.error('Error updating batch status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findByIdAndDelete(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting batch:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};