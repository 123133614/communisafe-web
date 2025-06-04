const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema({
  fullname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: "resident" },
  contactNumber: { type: String, required: true },
  address: { type: String },
  isEmailConfirmed: { type: Boolean, default: false },
  confirmToken: { type: String },
  confirmTokenExpiry: { type: Date },
  uploadID: { type: String },
  profileImage:    { type: String } 
});

module.exports = mongoose.model("Resident", residentSchema);
