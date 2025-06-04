// controller/incidentController.js
const Incident = require("../models/Incident"); // adjust if moved
const Announcement = require("../models/Announcement"); // adjust if moved

exports.createIncident = async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      date,
      type,
      location,
      description,
      status
    } = req.body;

    const image = req.file ? req.file.filename : null;

    // Save incident
    const incident = new Incident({
      name,
      contactNumber,
      date,
      type,
      location,
      description,
      status: status || "Pending",
      image
    });

    const savedIncident = await incident.save();

    // Auto-post to announcements
    const announcement = new Announcement({
      title: `${type} reported at ${location}`, // ✅ fixed string interpolation
      description,
      category: "Incident Report",
      location,
      image,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isUrgent: false
    });

    await announcement.save();

    res.status(201).json(savedIncident);
  } catch (error) {
    console.error("❌ Error creating incident:", error);
    res.status(500).json({ message: "Failed to create incident" });
  }
};
