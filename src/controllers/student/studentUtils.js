// utils/studentUtils.js
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const s3 = require("../../utils/s3");

// ✅ Parse JSON field safely
function parseJsonField(field, fieldName, existing = null) {
  if (!field) return existing;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      throw new Error(`Invalid ${fieldName} format`);
    }
  }
  return existing ? { ...existing, ...field } : field;
}

// ✅ Generate registration number
async function generateRegistrationNo(Student, className) {
  const classMap = { "9th": "09", "10th": "10", "11th": "11", "12th": "12" };
  const classCode = classMap[className] || "00";
  const yearCode = new Date().getFullYear().toString().slice(-2);

  const lastStudent = await Student.findOne({
    className,
    registrationNo: { $regex: `^TB${classCode}${yearCode}` },
  }).sort({ registrationNo: -1 });

  let serialNo = "001";
  if (lastStudent) {
    const lastSerial = parseInt(lastStudent.registrationNo.slice(-3));
    serialNo = String(lastSerial + 1).padStart(3, "0");
  }

  return `TB${classCode}${yearCode}${serialNo}`;
}


// ✅ Upload image to DigitalOcean Spaces
async function uploadImage(file) {
  const fileKey = `students/${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: "image-store",
    Key: fileKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(params).promise();
  return { image: uploadResult.Location, imageKey: fileKey };
}

// ✅ Delete old image from DigitalOcean Spaces
async function deleteImage(imageKey) {
  if (!imageKey) return;
  try {
    await s3.deleteObject({ Bucket: "image-store", Key: imageKey }).promise();
  } catch (err) {
    console.error("Failed to delete old image:", err);
  }
}

// ✅ Generate QR Code
async function generateQRCode(registrationNo) {
  return await QRCode.toDataURL(registrationNo, {
    errorCorrectionLevel: "H",
    type: "image/png",
    width: 300,
    margin: 2,
  });
}

module.exports = {
  parseJsonField,
  generateRegistrationNo,
  uploadImage,
  deleteImage,
  generateQRCode,
};
