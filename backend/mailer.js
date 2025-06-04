// backend/utils/mailer.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Use your Gmail in .env
    pass: process.env.EMAIL_PASS, // App Password from Gmail
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Ready to send emails!");
  }
});

module.exports = transporter;
