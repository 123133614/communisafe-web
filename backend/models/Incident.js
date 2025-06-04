// Incident.js
const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  image: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
