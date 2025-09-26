const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const s3 = require("./s3");

const BUCKET = "image-store"; // replace with your DO Space bucket

async function generateFeeReceipt(fee, student) {
  const fileName = `${student.registrationNo}_receipt.pdf`;
  const filePath = path.join(__dirname, "../tmp", fileName);

  // ensure tmp directory exists
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Title
  doc.fontSize(20).text("Admission Fee Receipt", { align: "center" });
  doc.moveDown();

  // Student & Fee Details
  doc.fontSize(12).text(`Student Name: ${student.studentName}`);
  doc.text(`Registration No: ${student.registrationNo}`);
  doc.text(`Total Fee: ₹${fee.totalFee}`);
  doc.text(`Discount: ₹${fee.totalDiscount}`);
  doc.text(`Paid: ₹${fee.paidAmount}`);
  doc.text(`Pending: ₹${fee.pendingAmount}`);
  doc.text(`Status: ${fee.status}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);

  doc.end();

  // Wait for file to be written
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  // Upload to DO Spaces
  const fileContent = fs.readFileSync(filePath);
  const upload = await s3
    .upload({
      Bucket: BUCKET,
      Key: `receipts/${fileName}`,
      Body: fileContent,
      ACL: "public-read", // ✅ must be public
      ContentType: "application/pdf",
    })
    .promise();

  // upload.Location gives the public URL
  return upload.Location;
}

module.exports = { generateFeeReceipt };
