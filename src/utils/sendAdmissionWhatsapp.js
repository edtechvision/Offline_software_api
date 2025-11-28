const axios = require("axios");

// async function sendAdmissionWhatsapp(student, receiptPath) {
//   const safe = (val, fallback = "N/A") => (val ? String(val) : fallback);

//   // Payload according to the WhatsApp API spec
//   const payload = {
//     apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Zjk1YzE2ZmRiMGIxMGI3OWMyNGExZiIsIm5hbWUiOiJUQVJHRVQgQk9BUkQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjZmOTVjMTZmZGIwYjEwYjc5YzI0YTE2IiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3Mjc2MTgwNzB9.QzLBhqmZyhlLmWh6aIL5V40IWVxlLbSUL7g6bP7C8Ok", // keep API key in env, not hardcoded!
//     campaignName: "Offline_admission_recipt",
//     destination: safe(student.mobileNumber, "919999999999"), // fallback number
//     userName: safe(student.studentName, "Student"),
//     source: safe(student.centerCode, "TB"), // fallback if no source
//     media: {
//       url: receiptPath || "https://yourcdn.com/default-receipt.pdf",
//       filename: "Admission_Receipt.pdf",
//     },
//     templateParams: [
//       safe(student.studentName, "Student"),     // greeting
//       safe(student.admissionId, "N/A"),         // Admission ID (English)
//       safe(student.admissionDate, "N/A"),       // Date (English)
//       safe(student.courseName, "N/A"),          // Course (English)
//       safe(student.batchName, "N/A"),           // Batch (English)
//       safe(student.studentName, "Student"),     // greeting (Hindi)
//       safe(student.admissionId, "N/A"),         // Admission ID (Hindi)
//       safe(student.admissionDate, "N/A"),       // Date (Hindi)
//       safe(student.courseName, "N/A"),          // Course (Hindi)
//       safe(student.batchName, "N/A"),           // Batch (Hindi)
//     ],
//   };

//   try {
//     const response = await axios.post(
//       "https://backend.api-wa.co/campaign/digintra/api/v2",
//       payload,
//       {
//         headers: { "Content-Type": "application/json" },
//       }
//     );

//     console.log("✅ WhatsApp API response:", response.data);
//     return response.data;
//   } catch (err) {
//     if (err.response) {
//       console.error("❌ WhatsApp API Error:", {
//         status: err.response.status,
//         statusText: err.response.statusText,
//         data: err.response.data,
//       });
//     } else {
//       console.error("❌ Request Error:", err.message);
//     }
//     throw new Error("Failed to send WhatsApp message");
//   }
// }
async function sendAdmissionWhatsapp(student, receiptPath) {
  const safe = (v, fb = "N/A") => (v ? String(v) : fb);

  const payload = {
    apiKey: process.env.WHATSAPP_API_KEY, // move key to env
  campaignName: "ADMISSION STUDENTS SIDE ",
    destination: safe(student.mobileNumber, "919999999999"),
    userName: safe(student.studentName, "Student"),
    source: safe(student.centerCode, "Imported"),

    // ⬇ MUST MATCH TEMPLATE PLACEHOLDERS ORDER
    templateParams: [
      safe(student.studentName, "Student"),            // []
      safe(student.admissionId, "N/A"),                // []
      safe(student.admissionDate, "N/A"),              // []
      safe(student.courseName, "N/A"),                 // []
      safe(student.batchName, "N/A"),                  // []
      safe(student.courseFee, "0"),                    // []
      safe(student.collectedAmount, "0"),              // []
      safe(student.duesAmount, "0"),                   // []
    ],

    media: {
      url: receiptPath || "https://yourcdn.com/default-receipt.pdf",
      filename: "Admission_Receipt.pdf"
    },

    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: "user"
    }
  };

  try {
    const response = await axios.post(
      "https://apihub.msg24x7.com/getInteractedCustomerDetail/sendapicampaign",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ WhatsApp API Response:", response.data);
    return response.data;

  } catch (err) {
    if (err.response) {
      console.error("❌ WhatsApp API Error:", {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
    } else {
      console.error("❌ Request Error:", err.message);
    }
    throw new Error("Failed to send WhatsApp message");
  }
}

module.exports = { sendAdmissionWhatsapp };
