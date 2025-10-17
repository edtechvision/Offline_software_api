const axios = require("axios");
const Course = require("../models/Course");

async function sendAdminWhatsapp(student, fee) {
  const safe = (val, fallback = "N/A") => (val ? String(val) : fallback);

  // ✅ Get course name by courseId if available
  let courseName = "N/A";
  try {
    const courseId =
      student.courseDetails?.courseId || student.courseId || null;
    console.log(student.courseDetails?.courseId);

    if (courseId) {
      const course = await Course.findById(courseId).select("name");
      console.log(course);
      if (course) courseName = course.name;
    }
  } catch (err) {
    console.error("⚠️ Failed to fetch course name:", err.message);
  }

  const payload = {
    apiKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Zjk1YzE2ZmRiMGIxMGI3OWMyNGExZiIsIm5hbWUiOiJUQVJHRVQgQk9BUkQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjZmOTVjMTZmZGIwYjEwYjc5YzI0YTE2IiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3Mjc2MTgwNzB9.QzLBhqmZyhlLmWh6aIL5V40IWVxlLbSUL7g6bP7C8Ok", // keep API key in env, not hardcoded!
    campaignName: "admission_notice",
    destination: "7070852272",
    userName: "TARGET BOARD",
    templateParams: [
      safe(student.studentName, "N/A"), // {{1}} Name
      safe(student.registrationNo, "N/A"), // {{2}} Reg ID
      safe(student.mobileNumber, "N/A"), // {{3}} Phone no
      safe(courseName, "N/A"), // {{4}} ✅ Course Name from DB
      safe(fee?.totalFee, "0"), // {{5}} Total Fee
      safe(fee?.paidAmount, "0"), // {{6}} Received Amount
      safe(fee?.pendingAmount, "0"), // {{7}} Total Dues
    ],
  };

  try {
    const response = await axios.post(
      "https://backend.api-wa.co/campaign/digintra/api/v2",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Admin WhatsApp alert sent:", response.data);
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ WhatsApp API Error:", {
        status: err.response.status,
        data: err.response.data,
      });
    } else {
      console.error("❌ Request Error:", err.message);
    }
    throw new Error("Failed to send admin WhatsApp message");
  }
}

module.exports = { sendAdminWhatsapp };
