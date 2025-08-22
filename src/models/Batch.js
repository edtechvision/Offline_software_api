const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: [true, 'Batch name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Batch name cannot exceed 100 characters']
  },
 
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

// Index for better performance
batchSchema.index({ batchName: 1 });
batchSchema.index({ isActive: 1 });


module.exports = mongoose.model('Batch', batchSchema);