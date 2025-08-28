const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const Student = require('../../models/Student');
const bwipjs = require('bwip-js');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.DO_SPACE_KEY,
  secretAccessKey: process.env.DO_SPACE_SECRET,
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: 'blr1', // Add your region
 
});


// Configure multer for S3 uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.DO_SPACE_BUCKET,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'student-images/' + uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('image');

// exports.createStudent = async (req, res) => {
//   try {
//     // Handle file upload
//     upload(req, res, async function(err) {
//       if (err instanceof multer.MulterError) {
//         if (err.code === 'LIMIT_FILE_SIZE') {
//           return res.status(400).json({ 
//             success: false, 
//             message: 'File size too large. Maximum size is 5MB.' 
//           });
//         }
//         return res.status(400).json({ 
//           success: false, 
//           message: `File upload error: ${err.message}` 
//         });
//       } else if (err) {
//         return res.status(400).json({ 
//           success: false, 
//           message: err.message 
//         });
//       }

//       try {
//         const studentData = req.body;
        
//         // Validate required fields
//         const requiredFields = [
//           'inchargeCode', 'inchargeName', 'studentName', 'fathersName', 
//           'mothersName', 'dateOfBirth', 'category', 'nationality', 'gender',
//           'email', 'mobileNumber', 'adharNumber', 'collegeName', 'className'
//         ];
        
//         const missingFields = requiredFields.filter(field => !studentData[field]);
//         if (missingFields.length > 0) {
//           return res.status(400).json({
//             success: false,
//             message: `Missing required fields: ${missingFields.join(', ')}`
//           });
//         }
        
//         // Validate email format
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(studentData.email)) {
//           return res.status(400).json({
//             success: false,
//             message: 'Invalid email format'
//           });
//         }
        
//         // Parse nested objects if they are sent as strings
//         if (typeof studentData.presentAddress === 'string') {
//           try {
//             studentData.presentAddress = JSON.parse(studentData.presentAddress);
//           } catch (parseError) {
//             return res.status(400).json({
//               success: false,
//               message: 'Invalid presentAddress format'
//             });
//           }
//         }
        
//         if (typeof studentData.permanentAddress === 'string') {
//           try {
//             studentData.permanentAddress = JSON.parse(studentData.permanentAddress);
//           } catch (parseError) {
//             return res.status(400).json({
//               success: false,
//               message: 'Invalid permanentAddress format'
//             });
//           }
//         }
        
//         if (typeof studentData.courseDetails === 'string') {
//           try {
//             studentData.courseDetails = JSON.parse(studentData.courseDetails);
//           } catch (parseError) {
//             return res.status(400).json({
//               success: false,
//               message: 'Invalid courseDetails format'
//             });
//           }
//         }
        
//         // If permanent address is same as present address
//         if (studentData.isPermanentSameAsPresent) {
//           studentData.permanentAddress = { ...studentData.presentAddress };
//         }
        
//         // Add image URL if file was uploaded
//         if (req.file) {
//           studentData.courseDetails = studentData.courseDetails || {};
//           studentData.courseDetails.image = req.file.location; // S3 URL
//         }

//         // Create and save student
//         studentData.registrationNo = 'TB' + Math.floor(100000 + Math.random() * 900000);

//         // Create and save student
//         const student = new Student(studentData);
//         const savedStudent = await student.save();
        
//         res.status(201).json({
//           success: true,
//           message: 'Student created successfully',
//           data: savedStudent
//         });
        
//       } catch (error) {
//         // Handle duplicate key error (Aadhar number)
//         if (error.code === 11000) {
//           return res.status(400).json({
//             success: false,
//             message: 'A student with this Aadhar number already exists'
//           });
//         }
        
//         // Handle validation errors
//         if (error.name === 'ValidationError') {
//           const errors = Object.values(error.errors).map(err => err.message);
//           return res.status(400).json({
//             success: false,
//             message: 'Validation failed',
//             errors: errors
//           });
//         }
        
//         // Handle other errors
//         console.error('Error creating student:', error);
//         res.status(500).json({
//           success: false,
//           message: 'Internal server error'
//         });
//       }
//     });
//   } catch (error) {
//     console.error('Unexpected error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'An unexpected error occurred'
//     });
//   }
// };


exports.createStudent = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        const studentData = req.body;

        // ✅ Generate registration number (Class + Year + Serial)
        const classMap = {
          "9th": "09",
          "10th": "10",
          "11th": "11",
          "12th": "12",
        };

        // Class Code (default "00" if not found)
        const classCode = classMap[studentData.className] || "00";

        // Last 2 digits of year
        const yearCode = new Date().getFullYear().toString().slice(-2);

        // Find last student in same class & year
        const lastStudent = await Student.findOne({
          className: studentData.className,
          registrationNo: { $regex: `^${classCode}${yearCode}` },
        }).sort({ registrationNo: -1 });

        // Generate serial no
        let serialNo = "001";
        if (lastStudent) {
          const lastRegNo = lastStudent.registrationNo;
          const lastSerial = parseInt(lastRegNo.slice(-3)); // last 3 digits
          serialNo = String(lastSerial + 1).padStart(3, "0");
        }

        // Final registration number
        studentData.registrationNo = `${classCode}${yearCode}${serialNo}`;

        // ✅ Validate required fields
        const requiredFields = [
          "inchargeCode",
          "inchargeName",
          "studentName",
          "fathersName",
          "mothersName",
          "dateOfBirth",
          "category",
          "nationality",
          "gender",
          "email",
          "mobileNumber",
          "adharNumber",
          "collegeName",
          "className",
        ];

        const missingFields = requiredFields.filter(
          (field) => !studentData[field]
        );
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(", ")}`,
          });
        }

        // ✅ Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentData.email)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }

        // ✅ Parse nested JSON if needed
        if (typeof studentData.presentAddress === "string") {
          try {
            studentData.presentAddress = JSON.parse(
              studentData.presentAddress
            );
          } catch {
            return res.status(400).json({
              success: false,
              message: "Invalid presentAddress format",
            });
          }
        }

        if (typeof studentData.permanentAddress === "string") {
          try {
            studentData.permanentAddress = JSON.parse(
              studentData.permanentAddress
            );
          } catch {
            return res.status(400).json({
              success: false,
              message: "Invalid permanentAddress format",
            });
          }
        }

        if (typeof studentData.courseDetails === "string") {
          try {
            studentData.courseDetails = JSON.parse(studentData.courseDetails);
          } catch {
            return res.status(400).json({
              success: false,
              message: "Invalid courseDetails format",
            });
          }
        }

        // ✅ If permanent address same as present
        if (studentData.isPermanentSameAsPresent) {
          studentData.permanentAddress = { ...studentData.presentAddress };
        }

        // ✅ Save image if uploaded
        if (req.file) {
          studentData.image = req.file.location;
        }

        // ✅ Extra validation for courseDetails
        if (studentData.courseDetails) {
          const {
            paymentType,
            downPayment,
            nextPaymentDueDate,
            paymentMode,
            transactionId,
          } = studentData.courseDetails;

          if (paymentType === "EMI") {
            if (!downPayment || !nextPaymentDueDate) {
              return res.status(400).json({
                success: false,
                message:
                  "For EMI payment type, downPayment and nextPaymentDueDate are required",
              });
            }
          }

          if (paymentMode === "UPI") {
            if (!transactionId) {
              return res.status(400).json({
                success: false,
                message: "Transaction Id required",
              });
            }
          }
        }

        // ✅ Generate Barcode
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: "code128",
          text: studentData.registrationNo,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: "center",
        });

        studentData.barcode = `data:image/png;base64,${barcodeBuffer.toString(
          "base64"
        )}`;

        // ✅ Save student
        const student = new Student(studentData);
        const savedStudent = await student.save();

        res.status(201).json({
          success: true,
          message: "Student created successfully",
          data: savedStudent,
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: "A student with this Aadhar number already exists",
          });
        }

        if (error.name === "ValidationError") {
          const errors = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors,
          });
        }

        console.error("Error creating student:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};


exports.updateStudent = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        const { id } = req.params;
        const studentData = req.body;

        // ✅ Check if student exists
        const existingStudent = await Student.findById(id);
        if (!existingStudent) {
          return res.status(404).json({
            success: false,
            message: "Student not found",
          });
        }

        // ✅ Validate required fields
        const requiredFields = [
          "inchargeCode",
          "inchargeName",
          "studentName",
          "fathersName",
          "mothersName",
          "dateOfBirth",
          "category",
          "nationality",
          "gender",
          "email",
          "mobileNumber",
          "adharNumber",
          "collegeName",
          "className",
        ];

        const missingFields = requiredFields.filter(
          (field) => !studentData[field] && !existingStudent[field]
        );
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(", ")}`,
          });
        }

        // ✅ Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (studentData.email && !emailRegex.test(studentData.email)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }

        // ✅ Parse nested objects if they are sent as strings
        const parseJSON = (fieldName) => {
          if (typeof studentData[fieldName] === "string") {
            try {
              studentData[fieldName] = JSON.parse(studentData[fieldName]);
            } catch {
              return res.status(400).json({
                success: false,
                message: `Invalid ${fieldName} format`,
              });
            }
          }
        };

        parseJSON("presentAddress");
        parseJSON("permanentAddress");
        parseJSON("courseDetails");

        // ✅ If permanent address same as present
        if (studentData.isPermanentSameAsPresent) {
          studentData.permanentAddress = { ...studentData.presentAddress };
        }

        // ✅ Handle image upload
        if (req.file) {
          studentData.image = req.file.location;

          // Delete old image from S3 if it exists
          if (existingStudent.image) {
            try {
              const oldImageKey = existingStudent.image.split("/").pop();
              await s3
                .deleteObject({
                  Bucket: process.env.DO_SPACE_BUCKET,
                  Key: `student-images/${oldImageKey}`,
                })
                .promise();
            } catch (s3Error) {
              console.error("Error deleting old image from S3:", s3Error);
              // Continue with update even if old image deletion fails
            }
          }
        }

        // ✅ Extra validation for courseDetails
        if (studentData.courseDetails) {
          const {
            paymentType,
            downPayment,
            nextPaymentDueDate,
            paymentMode,
            transactionId,
          } = studentData.courseDetails;

          if (paymentType === "EMI") {
            if (!downPayment || !nextPaymentDueDate) {
              return res.status(400).json({
                success: false,
                message:
                  "For EMI payment type, downPayment and nextPaymentDueDate are required",
              });
            }
          }

          if (paymentMode === "UPI") {
            if (!transactionId) {
              return res.status(400).json({
                success: false,
                message: "Transaction Id required",
              });
            }
          }
        }

        // ✅ Regenerate registrationNo if className is changed
        if (
          studentData.className &&
          studentData.className !== existingStudent.className
        ) {
          const classMap = {
            "9th": "09",
            "10th": "10",
            "11th": "11",
            "12th": "12",
          };

          const classCode = classMap[studentData.className] || "00";
          const yearCode = new Date().getFullYear().toString().slice(-2);

          const lastStudent = await Student.findOne({
            className: studentData.className,
            registrationNo: { $regex: `^${classCode}${yearCode}` },
          }).sort({ registrationNo: -1 });

          let serialNo = "001";
          if (lastStudent) {
            const lastRegNo = lastStudent.registrationNo;
            const lastSerial = parseInt(lastRegNo.slice(-3));
            serialNo = String(lastSerial + 1).padStart(3, "0");
          }

          studentData.registrationNo = `${classCode}${yearCode}${serialNo}`;
        }

        // ✅ Ensure barcode exists (or regenerate if registrationNo changed)
        if (
          !existingStudent.barcode ||
          studentData.registrationNo !== existingStudent.registrationNo
        ) {
          const barcodeBuffer = await bwipjs.toBuffer({
            bcid: "code128",
            text: studentData.registrationNo || existingStudent.registrationNo,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: "center",
          });

          studentData.barcode = `data:image/png;base64,${barcodeBuffer.toString(
            "base64"
          )}`;
        }

        // ✅ Update student
        const updatedStudent = await Student.findByIdAndUpdate(
          id,
          { $set: studentData },
          {
            new: true,
            runValidators: true,
          }
        );

        res.status(200).json({
          success: true,
          message: "Student updated successfully",
          data: updatedStudent,
        });
      } catch (error) {
        // Handle duplicate key error (Aadhar number)
        if (error.code === 11000) {
          return res.status(400).json({
            success: false,
            message: "A student with this Aadhar number already exists",
          });
        }

        if (error.name === "ValidationError") {
          const errors = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors,
          });
        }

        if (error.name === "CastError") {
          return res.status(400).json({
            success: false,
            message: "Invalid student ID format",
          });
        }

        console.error("Error updating student:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};



exports.getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {};
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Search across multiple fields
      searchQuery.$or = [
        { studentName: searchRegex },
        { fathersName: searchRegex },
        { mothersName: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex },
        { adharNumber: searchRegex },
        { inchargeName: searchRegex },
        { inchargeCode: searchRegex },
        { collegeName: searchRegex },
        { className: searchRegex },
        { 'presentAddress.city': searchRegex },
        { 'presentAddress.state': searchRegex }
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const students = await Student.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
        .populate("courseDetails.courseId", "name fee")
  .populate("courseDetails.additionalCourseId", "name fee")
  .populate("courseDetails.batchId", "batchName")

    // Get total count for pagination info
    const totalStudents = await Student.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalStudents / limitNum);

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        students,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStudents,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find student by ID and populate related fields
    const student = await Student.findById(id)
      .select('-__v')
      .populate("courseDetails.courseId", "name fee")
      .populate("courseDetails.additionalCourseId", "name fee")
      .populate("courseDetails.batchId", "batchName");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student
    });

  } catch (error) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
