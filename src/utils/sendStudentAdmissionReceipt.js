const Student = require("./../models/Student"); // your student model
const { sendAdmissionWhatsapp } = require("./sendAdmissionWhatsapp");

async function sendStudentAdmissionReceipt(studentId, receiptPath) {
  try {
    // ✅ Fetch student + populate relational fields
    const student = await Student.findById(studentId)
      .populate("courseDetails.courseId") // course name, etc.
      .populate("courseDetails.additionalCourseId")
      .populate("courseDetails.batchId") // batch info
      .populate("centerId"); // center info

    if (!student) {
      throw new Error("Student not found");
    }
    console.log(student);

    // ✅ Prepare student object for WhatsApp template
    const studentData = {
      studentName: student.studentName,
      admissionId: student.registrationNo,
      admissionDate: student.createdAt.toISOString().split("T")[0], // yyyy-mm-dd
      courseName: student.courseDetails?.courseId?.name || "N/A",
      batchName: student.courseDetails?.batchId?.batchName || "N/A",
      mobileNumber: student.mobileNumber,
      centerCode: student.centerCode,
    };

    // ✅ Call your WhatsApp sender
    const response = await sendAdmissionWhatsapp(studentData, receiptPath);

    console.log("📩 WhatsApp sent:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to send student admission receipt:", err.message);
    throw err;
  }
}

module.exports = { sendStudentAdmissionReceipt };
