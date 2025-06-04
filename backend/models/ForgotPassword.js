// backend/controllers/authController.js
const crypto = require('crypto');
const Resident = require('../models/Resident');
const Security = require('../models/Security');
const Official = require('../models/Official');
const transporter = require('../utils/mailer'); // iyong nodemailer setup mo

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user =
      (await Resident.findOne({ email })) ||
      (await Security.findOne({ email })) ||
      (await Official.findOne({ email }));

    if (!user) return res.status(404).json({ error: 'No user found with this email.' });

    const token = crypto.randomBytes(32).toString("hex");
    user.confirmToken = token;
    user.confirmTokenExpiry = Date.now() + 3600000; // 1 hour
    user.isEmailConfirmed = false; // Reset confirmation every time
    await user.save();

    const confirmLink = `http://localhost:5000/api/auth/confirm-email/${token}`;

    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Confirm Email to Reset Password",
      html: `
        <h3>Confirm Email</h3>
        <p>Click below to reset your password:</p>
        <a href="${confirmLink}">Confirm Email</a>
      `
    });

    res.status(200).json({ message: 'Confirmation link sent to your email.' });

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// confirmEmail
exports.confirmEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user =
      (await Resident.findOne({ confirmToken: token, confirmTokenExpiry: { $gt: Date.now() } })) ||
      (await Security.findOne({ confirmToken: token, confirmTokenExpiry: { $gt: Date.now() } })) ||
      (await Official.findOne({ confirmToken: token, confirmTokenExpiry: { $gt: Date.now() } }));

    if (!user) return res.status(400).send("Invalid or expired confirmation link.");

    user.isEmailConfirmed = true;
    user.confirmToken = undefined;
    user.confirmTokenExpiry = undefined;
    await user.save();

    res.redirect(`http://localhost:3000/reset-password/${user._id}`);
  } catch (err) {
    console.error('Email Confirm Error:', err);
    res.status(500).send("Error confirming email.");
  }
};

// resetPasswordById
exports.resetPasswordById = async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  try {
    const user =
      (await Resident.findById(userId)) ||
      (await Security.findById(userId)) ||
      (await Official.findById(userId));

    if (!user) return res.status(404).json({ error: "User not found." });

    if (!user.isEmailConfirmed) {
      return res.status(403).json({ error: "Please confirm your email before resetting password." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.isEmailConfirmed = false; // Require reconfirm next time
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Server error." });
  }
};