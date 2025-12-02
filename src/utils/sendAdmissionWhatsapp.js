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
// async function sendAdmissionWhatsapp(student, receiptPath) {
//   const safe = (v, fb = "N/A") => (v ? String(v) : fb);

//   // ⭐ REQUIRED payload (as per official MSG24x7 documentation)
//   const payload = {
//     apiKey:
//         "6ad4--T4z4oQiWWfhyPUU5swiCi2NzYhj-rI9y3PMlTj0tMjRTQpVDVstxE9jcgB67J5bz5pm1NmsX6IkdFWb8J4qr6geaZM1vartk1B8Ryc",

//     campaignName: "ADMISSION STUDENTS SIDE",
//     destination: safe(student.mobileNumber, "919999999999"),
//     userName: safe(student.studentName, "Student"),
//     source: safe(student.centerCode, "Imported"),

//     // ⭐ MUST match template placeholder order
//     templateParams: [
//       safe(student.studentName, "Student"),      // {{1}}
//       safe(student.admissionId, "N/A"),          // {{2}}
//       safe(student.admissionDate, "N/A"),        // {{3}}
//       safe(student.courseName, "N/A"),           // {{4}}
//       safe(student.batchName, "N/A"),            // {{5}}
//       safe(student.courseFee, "0"),              // {{6}}
//       safe(student.collectedAmount, "0"),        // {{7}}
//       safe(student.duesAmount, "0"),             // {{8}}
//     ],

//     // ⭐ MEDIA allowed by documentation
//     media: {
//       url: receiptPath || "https://yourcdn.com/default-receipt.pdf",
//       filename: "Admission_Receipt.pdf"
//     },

//     // ⭐ Optional fields supported by docs
//     tags: ["Admission"], // optional
//     attributes: {
//       FirstName: safe(student.studentName)
//     }
//   };

//   try {
//     const response = await axios.post(
//       "https://apihub.msg24x7.com/getInteractedCustomerDetail/sendapicampaign",
//       payload,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     console.log("✅ WhatsApp API Response:", response.data);
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

  // Ensure mobile number has country code +91
  const destinationNumber = (() => {
    const raw = safe(student.mobileNumber, "9999999999");
    return raw.startsWith("91") ? raw : "91" + raw.replace(/^0+/, "");
  })();

  // Payload according to MSG24x7 docs
  const payload = {
  apiKey:"6ad4--T4z4oQiWWfhyPUU5swiCi2NzYhj-rI9y3PMlTj0tMjRTQpVDVstxE9jcgB67J5bz5pm1NmsX6IkdFWb8J4qr6geaZM1vartk1B8Ryc",

    campaignName: "ADMISSION STUDENTS SIDE ",
    destination: destinationNumber,
    userName: safe(student.studentName, "Student"),
    source: safe(student.centerCode, "Imported"),

    templateParams: [
      safe(student.studentName, "Student"),
      safe(student.admissionId, "N/A"),
      safe(student.admissionDate, "N/A"),
      safe(student.courseName, "N/A"),
      safe(student.batchName, "N/A"),
      safe(student.courseFee, "0"),
      safe(student.collectedAmount, "0"),
      safe(student.duesAmount, "0"),
    ],

    media: {
      url: receiptPath || "https://yourcdn.com/default-receipt.pdf",
      filename: "Admission_Receipt.pdf"
    },

    tags: ["Admission"],
    attributes: {
      FirstName: safe(student.studentName)
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
