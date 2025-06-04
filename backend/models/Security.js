const mongoose = require("mongoose");

const securitySchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "security" },
  isEmailConfirmed: { type: Boolean, default: false },
  contactNumber: { type: String, required: true },
   uploadID: { type: String },
  confirmToken: { type: String },
  confirmTokenExpiry: { type: Date },
  profileImage:    { type: String } 
});

module.exports = mongoose.model("Security", securitySchema);
