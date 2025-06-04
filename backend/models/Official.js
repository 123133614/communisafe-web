const mongoose = require("mongoose");

const officialSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "official" },
  contactNumber: { type: String, required: true },
  address: { type: String },
  verificationCode: { type: String }, // ✅ added
  uploadID: { type: String }, // ✅ added
  profileImage: { type: String }, // ✅ added
  isEmailConfirmed: { type: Boolean, default: false },
  confirmToken: { type: String },
  confirmTokenExpiry: { type: Date },
  
});

module.exports = mongoose.model("Official", officialSchema);
