const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "General" },
  location: { type: String },
  image: { type: String, default: null },
  date: { type: String },
  time: { type: String },
  isUrgent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);
