// const fs = require("fs");
// const path = require("path");
// const PDFDocument = require("pdfkit");
// const s3 = require("./s3");

// const BUCKET = "image-store"; // replace with your DO Space bucket

// async function generateFeeReceipt(fee, student) {
//   const fileName = `${student.registrationNo}_receipt.pdf`;
//   const filePath = path.join(__dirname, "../tmp", fileName);

//   // ensure tmp directory exists
//   if (!fs.existsSync(path.dirname(filePath))) {
//     fs.mkdirSync(path.dirname(filePath), { recursive: true });
//   }

//   const doc = new PDFDocument();
//   const stream = fs.createWriteStream(filePath);
//   doc.pipe(stream);

//   // Title
//   doc.fontSize(20).text("Admission Fee Receipt", { align: "center" });
//   doc.moveDown();

//   // Student & Fee Details
//   doc.fontSize(12).text(`Student Name: ${student.studentName}`);
//   doc.text(`Registration No: ${student.registrationNo}`);
//   doc.text(`Total Fee: ₹${fee.totalFee}`);
//   doc.text(`Discount: ₹${fee.totalDiscount}`);
//   doc.text(`Paid: ₹${fee.paidAmount}`);
//   doc.text(`Pending: ₹${fee.pendingAmount}`);
//   doc.text(`Status: ${fee.status}`);
//   doc.text(`Date: ${new Date().toLocaleDateString()}`);

//   doc.end();

//   // Wait for file to be written
//   await new Promise((resolve, reject) => {
//     stream.on("finish", resolve);
//     stream.on("error", reject);
//   });

//   // Upload to DO Spaces
//   const fileContent = fs.readFileSync(filePath);
//   const upload = await s3
//     .upload({
//       Bucket: BUCKET,
//       Key: `receipts/${fileName}`,
//       Body: fileContent,
//       ACL: "public-read", // ✅ must be public
//       ContentType: "application/pdf",
//     })
//     .promise();

//   // upload.Location gives the public URL
//   return upload.Location;
// }

// module.exports = { generateFeeReceipt };

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const s3 = require("./s3");
const Course = require("../models/Course");
const Batch = require("../models/Batch");

const BUCKET = process.env.DO_SPACE_BUCKET || "image-store";

async function generateFeeReceipt(fee, student, paymentRecord) {
  const fileName = `Fee_Receipt_${student.studentName.replace(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  const filePath = path.join(__dirname, "../tmp", fileName);

  // Ensure tmp directory exists
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 30, bottom: 30, left: 40, right: 40 },
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Get course and batch details (populate these from your DB)
  const courseDetails = await getCourseDetails(fee.courseId);
  const batchDetails = await getBatchDetails(fee.batchId);

  // Logo placeholder (add your logo)
  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 30, { width: 60 });
  }

  // Header - Institute Name and Details
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1a1a1a")
    .text("TARGET BOARD", 120, 40, { align: "center" });

  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor("#333333")
    .text("Bihar Board NO-1 Educational Platform", 120, 65, {
      align: "center",
    });

  doc
    .fontSize(10)
    .text("Near Hp Petrol Pump, Main Road, Jehanabad, 804408", 120, 82, {
      align: "center",
    });

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#0066cc")
    .text("+91 7779855339", 120, 98, { align: "center" });

  // Draw line separator
  doc
    .moveTo(40, 125)
    .lineTo(555, 125)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();

  // Black header bar for "FEE RECEIPT"
  doc.rect(40, 135, 515, 35).fillAndStroke("#000000", "#000000");

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("FEE RECEIPT", 40, 145, { align: "center", width: 515 });

  // Student Details Box
  const leftBoxX = 40;
  const leftBoxY = 185;
  const leftBoxW = 350;
  const rightBoxX = 395;
  const rightBoxW = 160;
  const boxHeight = 180;

  // Left box border
  doc
    .rect(leftBoxX, leftBoxY, leftBoxW, boxHeight)
    .strokeColor("#000000")
    .lineWidth(1.5)
    .stroke();

  // Student Details Header
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("Student Details:", leftBoxX + 10, leftBoxY + 12);

  let yPos = leftBoxY + 35;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(student.studentName.toUpperCase(), leftBoxX + 10, yPos);

  yPos += 18;
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`F. Name- ${student.fathersName || "N/A"}`, leftBoxX + 10, yPos);

  yPos += 15;
  doc.text(`Address : ${student.address || "N/A"}`, leftBoxX + 10, yPos);

  yPos += 15;
  doc.text(
    `Class : ${student.className || courseDetails?.className || "N/A"}`,
    leftBoxX + 10,
    yPos
  );

  yPos += 15;
  doc
    .font("Helvetica")
    .text(`Course : ${courseDetails?.name || "N/A"}`, leftBoxX + 10, yPos, {
      width: leftBoxW - 20,
    });

  yPos += 15;
  doc.text(`Batch : ${batchDetails?.batchName || "N/A"}`, leftBoxX + 10, yPos);

  // Right box with receipt details
  doc
    .rect(rightBoxX, leftBoxY, rightBoxW, 60)
    .strokeColor("#000000")
    .lineWidth(1.5)
    .stroke();

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(
      `Receipt No : ${paymentRecord.receiptNo}`,
      rightBoxX + 8,
      leftBoxY + 12
    );

  doc
    .moveTo(rightBoxX, leftBoxY + 32)
    .lineTo(rightBoxX + rightBoxW, leftBoxY + 32)
    .stroke();

  doc.text(
    `Date : ${new Date(paymentRecord.paymentDate).toLocaleDateString("en-GB")}`,
    rightBoxX + 8,
    leftBoxY + 38
  );

  // Admission Number box
  doc
    .rect(rightBoxX, leftBoxY + 60, rightBoxW, 30)
    .strokeColor("#000000")
    .lineWidth(1.5)
    .stroke();

  doc.text(
    `Admission No : ${student.registrationNo}`,
    rightBoxX + 8,
    leftBoxY + 68
  );

  // Fee Receipt Table Header
  const tableY = 390;
  doc.rect(40, tableY, 515, 35).fillAndStroke("#f5f5f5", "#000000");

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("FEE RECEIPT", 40, tableY + 10, { align: "center", width: 515 });

  // Table structure
  const table = {
    startY: tableY + 40,
    rowHeight: 25,
    cols: [
      { x: 40, w: 60, label: "Sl. no." },
      { x: 100, w: 335, label: "Particular" },
      { x: 435, w: 120, label: "Amount" },
    ],
  };

  // Table header
  doc
    .rect(40, table.startY, 515, table.rowHeight)
    .fillAndStroke("#000000", "#000000");

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");

  table.cols.forEach((col) => {
    doc.text(col.label, col.x + 5, table.startY + 7, { width: col.w - 10 });
  });

  // Draw vertical lines for header
  table.cols.forEach((col, i) => {
    if (i > 0) {
      doc
        .moveTo(col.x, table.startY)
        .lineTo(col.x, table.startY + table.rowHeight)
        .strokeColor("#ffffff")
        .lineWidth(1)
        .stroke();
    }
  });

  // Table rows
  let rowY = table.startY + table.rowHeight;
  const rows = [
    ["1.", courseDetails?.courseName || "Course Fee", fee.totalFee],
    ["2.", "Previous Received Amount", fee.paidAmount - paymentRecord.amount],
    ["3.", "Amount Received", paymentRecord.amount],
  ];

  doc.fillColor("#000000").strokeColor("#000000");

  rows.forEach((row, i) => {
    // Row background
    doc.rect(40, rowY, 515, table.rowHeight).strokeColor("#000000").stroke();

    // Draw vertical lines
    table.cols.forEach((col, j) => {
      if (j > 0) {
        doc
          .moveTo(col.x, rowY)
          .lineTo(col.x, rowY + table.rowHeight)
          .stroke();
      }
    });

    // Row content
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(row[0], table.cols[0].x + 5, rowY + 8);

    doc.text(row[1], table.cols[1].x + 5, rowY + 8);

    doc.text(row[2].toString(), table.cols[2].x + 5, rowY + 8, {
      align: "right",
      width: table.cols[2].w - 10,
    });

    rowY += table.rowHeight;
  });

  // Total Received Amount row
  doc.rect(40, rowY, 435, table.rowHeight).stroke();

  doc.rect(435, rowY, 120, table.rowHeight).stroke();

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Total Received Amount", 100, rowY + 8, {
      align: "right",
      width: 330,
    });

  doc.text(fee.paidAmount.toString(), 440, rowY + 8, {
    align: "right",
    width: 110,
  });

  rowY += table.rowHeight;

  // Dues Amount row
  doc.rect(40, rowY, 435, table.rowHeight).stroke();

  doc.rect(435, rowY, 120, table.rowHeight).stroke();

  doc.text("Dues Amount", 100, rowY + 8, { align: "right", width: 330 });

  doc.text(fee.pendingAmount.toString(), 440, rowY + 8, {
    align: "right",
    width: 110,
  });

  // Footer notes
  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor("#666666")
    .text(
      "Note: This is a computer-generated receipt and does not require a signature.",
      40,
      rowY + 45,
      { align: "center", width: 515 }
    );

  doc.text(
    `Payment Mode: ${paymentRecord.paymentMode || "N/A"} | Transaction ID: ${
      paymentRecord.transactionId || "N/A"
    }`,
    40,
    rowY + 60,
    { align: "center", width: 515 }
  );

  doc.end();

  // Wait for PDF generation
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
      ACL: "public-read",
      ContentType: "application/pdf",
    })
    .promise();

  // Clean up local file
  fs.unlinkSync(filePath);

  return upload.Location;
}

// Helper functions (implement based on your models)
async function getCourseDetails(courseId) {
  // Replace with actual DB query

  return await Course.findById(courseId);
}

async function getBatchDetails(batchId) {
  // Replace with actual DB query

  return await Batch.findById(batchId);
}

module.exports = { generateFeeReceipt };
