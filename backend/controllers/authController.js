// controller.js
require("dotenv").config();
const bcrypt     = require("bcrypt");
const crypto     = require("crypto");
const nodemailer = require("nodemailer");

const Resident   = require("../models/Resident");
const Security   = require("../models/Security");
const Official   = require("../models/Official");
const VerificationCode = require("../models/VerificationCode");

// Nodemailer transporter 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// SEND VERIFICATION CODE 
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    // generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // upsert into VerificationCode collection, expires in 15 minutes
    await VerificationCode.findOneAndUpdate(
      { email },
      { code, expiresAt: Date.now() + 15 * 60 * 1000 },
      { upsert: true, new: true }
    );

    // send email
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Your CommuniSafe Verification Code",
      html: `
        <h2>CommuniSafe Email Verification</h2>
        <p>Your verification code is:</p>
        <h1>${code}</h1>
        <p>Enter this code in the app to complete your registration.</p>
        <p>– The CommuniSafe Team</p>
      `,
    });

    res.json({ message: "Verification code sent." });
  } catch (err) {
    console.error("❌ sendVerificationCode Error:", err);
    res.status(500).json({ error: "Could not send verification code." });
  }
};

// SIGNUP (with code validation for Security/Official)
exports.signup = async (req, res) => {
  const {
    fullname,
    email,
    password,
    role,
    contactNumber,
    address,
    employeeID,
    verificationCode,
  } = req.body;

  const normalizedEmail = email.toLowerCase();
  const uploadID = req.file?.filename || null;

  // choose model
  let UserModel;
  switch (role) {
    case "resident":
      UserModel = Resident;
      break;
    case "security":
      UserModel = Security;
      break;
    case "official":
      UserModel = Official;
      break;
    default:
      return res.status(400).json({ error: "Invalid role." });
  }

  try {
    // Validate code for non-resident
    if (role !== "resident") {
      const record = await VerificationCode.findOne({ email });
      if (
        !record ||
        record.code !== verificationCode ||
        record.expiresAt < Date.now()
      ) {
        return res
          .status(400)
          .json({ error: "Invalid or expired verification code." });
      }
      // remove it
      await VerificationCode.deleteOne({ email });
    }

    // Prevent duplicate email
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already exists." });
    }

    // Hash password + save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      fullname,
      email,
      password: hashedPassword,
      role,
      contactNumber,
      address,
      employeeID: role === "security" ? employeeID : undefined,
      uploadID: role !== "resident" ? uploadID : undefined,
    });
    await newUser.save();

    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Signup failed: " + err.message });
  }
};

// LOGIN 
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user =
      (await Resident.findOne({ email })) ||
      (await Security.findOne({ email })) ||
      (await Official.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    console.log("✅ User on login:", user);
    res.status(200).json({
      name: user.fullname,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      address: user.address,
      token: "mock-token",
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
};

//FORGOT PASSWORD (send email confirmation link) 
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user =
      (await Resident.findOne({ email })) ||
      (await Security.findOne({ email })) ||
      (await Official.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "No user found with this email." });
    }

    const confirmToken = crypto.randomBytes(32).toString("hex");
    user.confirmToken       = confirmToken;
    user.confirmTokenExpiry = Date.now() + 3600_000; // 1 hour
    await user.save();

    const confirmLink = `http://localhost:5000/api/auth/confirm-email/${confirmToken}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Confirm your Email to Reset Password",
      html: `
        <h3>Confirm Email</h3>
        <p>Hi ${user.fullname || "User"},</p>
        <p>Click below to confirm your email and reset your password:</p>
        <a href="${confirmLink}" style="padding:10px 20px; background:#007bff; color:white; text-decoration:none;">Confirm Email</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.status(200).json({ message: "Confirmation link sent to your email." });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to send confirmation email." });
  }
};

// CONFIRM EMAIL  
exports.confirmEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user =
      (await Resident.findOne({ confirmToken: token, confirmTokenExpiry: { $gt: Date.now() } })) ||
      (await Security.findOne({ confirmToken: token, confirmTokenExpiry: { $gt: Date.now() } })) ||
      (await Official.findOne({ confirmToken: token, confirmTokenExpiry: { $gt: Date.now() } }));

    if (!user) {
      return res.status(400).send("Invalid or expired confirmation link.");
    }

    user.isEmailConfirmed   = true;
    user.confirmToken       = undefined;
    user.confirmTokenExpiry = undefined;
    await user.save();

    // redirect to your frontend’s reset-password page
    res.redirect(`http://localhost:3000/reset-password/${user._id}`);
  } catch (err) {
    console.error("❌ Email Confirmation Error:", err);
    res.status(500).send("Server error during confirmation.");
  }
};

// FIND USER BY EMAIL 
exports.findUserByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user =
      (await Resident.findOne({ email })) ||
      (await Security.findOne({ email })) ||
      (await Official.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "No user found with this email." });
    }

    // if not confirmed yet, resend confirmation
    if (!user.isEmailConfirmed) {
      const confirmToken = crypto.randomBytes(32).toString("hex");
      user.confirmToken       = confirmToken;
      user.confirmTokenExpiry = Date.now() + 3600_000;
      await user.save();

      const confirmLink = `http://localhost:5000/api/auth/confirm-email/${confirmToken}`;
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Confirm your Email to Reset Password",
        html: `
          <h3>Confirm Email</h3>
          <p>Hi ${user.fullname || "User"},</p>
          <p>Click below to confirm your email and reset your password:</p>
          <a href="${confirmLink}" style="padding:10px 20px; background:#007bff; color:white; text-decoration:none;">Confirm Email</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });
      return res.status(200).json({ message: "New confirmation email sent." });
    }

    res.json({ userId: user._id });
  } catch (err) {
    console.error("❌ Find User Error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// RESET PASSWORD by Token 
exports.resetPassword = async (req, res) => {
  const { token }   = req.params;
  const { password }= req.body;

  try {
    const user =
      (await Resident.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })) ||
      (await Security.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })) ||
      (await Official.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } }));

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    user.password         = await bcrypt.hash(password, 10);
    user.resetToken       = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({ error: "Error resetting password." });
  }
};

//RESET PASSWORD by User ID
exports.resetPasswordById = async (req, res) => {
  const { userId }   = req.params;
  const { password } = req.body;

  try {
    const user =
      (await Resident.findById(userId)) ||
      (await Security.findById(userId)) ||
      (await Official.findById(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("❌ Reset Password By ID Error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// GET /api/user/:userId
exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user =
      (await Resident.findById(userId)) ||
      (await Security.findById(userId)) ||
      (await Official.findById(userId));
    if (!user) return res.status(404).json({ error: "User not found." });

    // strip password
    const { password, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};

// PUT /api/user/:userId
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullname, contactNumber, address } = req.body;
  const profileImageFilename = req.file?.filename;

  try {
    const user =
      (await Resident.findById(userId)) ||
      (await Security.findById(userId)) ||
      (await Official.findById(userId));
    if (!user) return res.status(404).json({ error: "User not found." });

    if (fullname)      user.fullname      = fullname;
    if (contactNumber) user.contactNumber = contactNumber;
    if (address)       user.address       = address;
    if (profileImageFilename) user.profileImage = profileImageFilename;

    await user.save();
    const { password, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update user." });
  }
};

