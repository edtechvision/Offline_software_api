
// exports.updateStudent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
    
//     // Check if student exists
//     const existingStudent = await Student.findById(id);
//     if (!existingStudent) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     // ✅ EARLY PARSE: Parse all JSON string fields immediately
//     if (updateData.presentAddress && typeof updateData.presentAddress === "string") {
//       try {
//         updateData.presentAddress = JSON.parse(updateData.presentAddress);
//       } catch (parseError) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid presentAddress format",
//         });
//       }
//     }

//    if (updateData.permanentAddress && typeof updateData.permanentAddress === "string") {
//       try {
//         updateData.permanentAddress = JSON.parse(updateData.permanentAddress);
//       } catch (parseError) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid permanentAddress format",
//         });
//       }
//     }

//      if (updateData.courseDetails && typeof updateData.courseDetails === "string") {
//       try {
//         updateData.courseDetails = JSON.parse(updateData.courseDetails);
//       } catch (parseError) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid courseDetails format",
//         });
//       }
//     }

//  // ✅ DEFENSIVE CHECK: Before using presentAddress
//     if (updateData.isPermanentSameAsPresent) {
//       // Use parsed presentAddress or fall back to existing
//       updateData.permanentAddress = updateData.presentAddress || existingStudent.presentAddress;
//     }
//     // If className is being updated, generate new registration number
//     if (updateData.className && updateData.className !== existingStudent.className) {
//       const classMap = {
//         "9th": "09",
//         "10th": "10",
//         "11th": "11",
//         "12th": "12",
//       };

//       const classCode = classMap[updateData.className] || "00";
//       const yearCode = new Date().getFullYear().toString().slice(-2);

//       const lastStudent = await Student.findOne({
//         className: updateData.className,
//         registrationNo: { $regex: `^${classCode}${yearCode}` },
//       }).sort({ registrationNo: -1 });

//       let serialNo = "001";
//       if (lastStudent) {
//         const lastRegNo = lastStudent.registrationNo;
//         const lastSerial = parseInt(lastRegNo.slice(-3));
//         serialNo = String(lastSerial + 1).padStart(3, "0");
//       }

//       updateData.registrationNo = `${classCode}${yearCode}${serialNo}`;
//     }

//     // Validate email if being updated
//     if (updateData.email) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(updateData.email)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid email format",
//         });
//       }
//     }

//     // Upload new image if provided
//     if (req.file) {
//       // Delete old image if exists
//       if (existingStudent.image) {
//         try {
//           // Extract the key from the URL (assuming DigitalOcean Spaces URL structure)
//           const urlParts = existingStudent.image.split('/');
//           const oldImageKey = urlParts.slice(3).join('/'); // Remove the domain parts
          
//           await s3.deleteObject({
//             Bucket: "image-store",
//             Key: oldImageKey,
//           }).promise();
//         } catch (deleteErr) {
//           console.error("Failed to delete old image:", deleteErr);
//           // Continue with upload even if deletion fails
//         }
//       }

//       // Upload new image
//       const fileName = `students/${uuidv4()}-${req.file.originalname}`;
//       const params = {
//         Bucket: "image-store",
//         Key: fileName,
//         Body: req.file.buffer,
//         ACL: "public-read",
//         ContentType: req.file.mimetype,
//       };

//       try {
//         const uploadResult = await s3.upload(params).promise();
//         updateData.image = uploadResult.Location;
//       } catch (uploadErr) {
//         console.error("Image upload failed:", uploadErr);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to upload image",
//         });
//       }
//     }

//     // Extra validation for courseDetails if being updated
//     if (updateData.courseDetails) {
//       const {
//         paymentType,
//         downPayment,
//         nextPaymentDueDate,
//         paymentMode,
//         transactionId,
//       } = updateData.courseDetails;

//       if (paymentType === "EMI") {
//         if (!downPayment || !nextPaymentDueDate) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "For EMI payment type, downPayment and nextPaymentDueDate are required",
//           });
//         }
//       }

//       if (paymentMode === "UPI") {
//         if (!transactionId) {
//           return res.status(400).json({
//             success: false,
//             message: "Transaction Id required",
//           });
//         }
//       }
//     }

//     // Generate new QR code if registration number changed
//     if (updateData.registrationNo && updateData.registrationNo !== existingStudent.registrationNo) {
//       try {
//         const qrCodeData = await QRCode.toDataURL(updateData.registrationNo, {
//           errorCorrectionLevel: "H",
//           type: "image/png",
//           width: 300,
//           margin: 2,
//         });

//         updateData.qrCode = qrCodeData;
//         updateData.qrCodeData = updateData.registrationNo;
//       } catch (qrErr) {
//         console.error("QR Code generation failed:", qrErr);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to generate QR Code",
//         });
//       }
//     }

//     // Update student
//     const updatedStudent = await Student.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Student updated successfully",
//       data: updatedStudent,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "A student with this Aadhar number already exists",
//       });
//     }

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: errors,
//       });
//     }

//     console.error("Error updating student:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };