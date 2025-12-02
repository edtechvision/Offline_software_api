const axios = require("axios");
const Student = require("../models/Student");
const Course = require("../models/Course");

// async function sendPaymentWhatsapp(fee, paymentEntry) {
//   try {
//     // ✅ Fetch related student and course details
//     const student = await Student.findById(fee.studentId).lean();
//     if (!student) throw new Error("Student not found");

//     let courseName = "N/A";
//     try {
//       const course = await Course.findById(fee.courseId).select("name");
//       if (course) courseName = course.name;
//     } catch (err) {
//       console.warn("⚠️ Could not fetch course name:", err.message);
//     }

//     // ✅ Define safe accessor
//     const safe = (val, fallback = "N/A") => (val ? String(val) : fallback);

//     // ✅ Prepare WhatsApp payload
//     const payload = {
//       apiKey:
//         "6ad4--T4z4oQiWWfhyPUU5swiCi2NzYhj-rI9y3PMlTj0tMjRTQpVDVstxE9jcgB67J5bz5pm1NmsX6IkdFWb8J4qr6geaZM1vartk1B8Ryc",
//       campaignName: "dues_clear",
//       destination: "7070852272",
//       userName: "TARGET BOARD",
//       templateParams: [
//         safe(student.studentName), // {{1}} Name
//         safe(student.registrationNo), // {{2}} Reg ID
//         safe(student.mobileNumber), // {{3}} Phone no
//         safe(courseName), // {{4}} Course
//         safe(fee.totalFee), // {{5}} Total Fee
//         safe(paymentEntry.previousReceivedAmount), // {{6}} Previous Amount
//         safe(paymentEntry.amount), // {{7}} Received Amount
//         safe(fee.pendingAmount), // {{8}} Total Dues
//       ],
//     };

//     // ✅ Send WhatsApp message
//     const response = await axios.post(
//       // "https://backend.api-wa.co/campaign/digintra/api/v2",
//       "https://apihub.msg24x7.com/getInteractedCustomerDetail/sendapicampaign",
//       payload,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     console.log("✅ Payment WhatsApp alert sent:", response.data);
//     return response.data;
//   } catch (err) {
//     if (err.response) {
//       console.error("❌ WhatsApp API Error:", {
//         status: err.response.status,
//         data: err.response.data,
//       });
//     } else {
//       console.error("❌ Payment WhatsApp Error:", err.message);
//     }
//   }
// }

async function sendPaymentWhatsapp(fee, paymentEntry) {
  try {
    // Fetch student
    const student = await Student.findById(fee.studentId).lean();
    if (!student) throw new Error("Student not found");

    // Fetch course
    let courseName = "N/A";
    try {
      const course = await Course.findById(fee.courseId).select("name");
      if (course) courseName = course.name;
    } catch (err) {
      console.warn("⚠️ Course fetch error:", err.message);
    }

    // Safe accessor
    const safe = (v, f = "N/A") => (v ? String(v) : f);

    // Prepare template parameters (as per your template)
    const templateParams = [
      safe(student.studentName),                     // {{1}}
      safe(student.registrationNo),                 // {{2}}
      safe(student.mobileNumber),                   // {{3}}
      safe(courseName),                             // {{4}}
      safe(fee.totalFee),                           // {{5}}
      safe(paymentEntry.previousReceivedAmount),    // {{6}}
      safe(paymentEntry.amount),                    // {{7}}
      safe(fee.pendingAmount),                      // {{8}}
    ];

    // FINAL PAYLOAD (exactly as documentation)
    const payload = {
      apiKey:
        "6ad4--T4z4oQiWWfhyPUU5swiCi2NzYhj-rI9y3PMlTj0tMjRTQpVDVstxE9jcgB67J5bz5pm1NmsX6IkdFWb8J4qr6geaZM1vartk1B8Ryc",

      campaignName: "Dues Student",
      destination: "917070852272",
      userName: "MSG24x7 Communications (DEMO)",

      source: "Imported",

      media: {
        url: "https://digintra.com/assets/boost-your-brand-with-stunning-digital-marketing-images-CoF0XcXs.jpg",
        filename: "sample_media",
      },

      templateParams,

      tags: ["Fees", "Payment"],

      attributes: {
        FirstName: safe(student.studentName),
      },
    };

    // API CALL (official endpoint)
    const response = await axios.post(
      "https://apihub.msg24x7.com/getInteractedCustomerDetail/sendapicampaign",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ WhatsApp Sent:", response.data);
    return response.data;

  } catch (err) {
    if (err.response) {
      console.error("❌ WhatsApp API Error:", err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}
module.exports = { sendPaymentWhatsapp };
