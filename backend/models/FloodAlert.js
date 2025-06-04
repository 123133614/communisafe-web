const mongoose = require("mongoose");

const floodAlertSchema = new mongoose.Schema({
  location: String,
  severity: String, // "LOW", "MEDIUM", "HIGH"
  description: String,
  timestamp: String,
  lat: Number,
  lng: Number
});

module.exports = mongoose.model("FloodAlert", floodAlertSchema);
