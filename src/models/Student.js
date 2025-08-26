const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullAddress: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true }
});

const courseSchema = new mongoose.Schema({
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    additionalCourseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  paymentType: { type: String, required: true,enum: ['Full-payment', 'EMI'] },
  downPayment:{ type: Number, required: false },
  nextPaymentDueDate:{ type: Date, required: false },
  courseFee: { type: Number, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
  session: { type: String, required: true },
  paymentMode: { 
    type: String, 
    required: true,
    enum: ['UPI', 'Cash', 'Card', 'Net Banking']
  },
  image: { type: String }, // Path to uploaded image
  referenceNumber: { type: String }
});

const studentSchema = new mongoose.Schema({
  inchargeCode: { type: String, required: true },
  inchargeName: { type: String, required: true },
  studentName: { type: String, required: true },
  barcode: { type: String, required: true },
    registrationNo: { type: String, required: true },
  fathersName: { type: String, required: true },
  mothersName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  category: { type: String, required: true },
  nationality: { type: String, required: true, default: 'Indian' },
  gender: { 
    type: String, 
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  email: { type: String },
  mobileNumber: { type: String, required: true },
  alternativeMobileNumber: { type: String },
  adharNumber: { type: String, required: true, unique: true },
  presentAddress: { type: addressSchema, required: true },
  permanentAddress: { type: addressSchema, required: true },
  isPermanentSameAsPresent: { type: Boolean, default: false },
  collegeName: { type: String, required: true },
  className: { type: String, required: true },
  courseDetails: { type: courseSchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);