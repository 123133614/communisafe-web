const express = require("express");
const router = express.Router();
const FloodAlert = require("../models/FloodAlert");
const Announcement = require("../models/Announcement"); // Import announcement model

// GET all alerts
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await FloodAlert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Error fetching flood alerts" });
  }
});

// POST a new flood report and also auto-post to Community Announcements
router.post("/report", async (req, res) => {
  try {
    // Step 1: Save to FloodAlert collection
    const alert = new FloodAlert(req.body);
    await alert.save();

    // Step 2: Create a Community Announcement from the same data
    const timestampParts = req.body.timestamp.split("T"); // ['YYYY-MM-DD', 'HH:MM']
    const date = timestampParts[0];
    const time = timestampParts[1];

    const announcement = new Announcement({
      title: `⚠️ Flood Alert at ${req.body.location}`,
      description: req.body.description,
      category: "Flood",
      location: req.body.location,
      image: null, // Optional: you can set a flood image URL or icon path
      date,
      time,
      isUrgent: req.body.severity === "HIGH"
    });

    await announcement.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to save flood report and announcement:", err);
    res.status(500).json({ error: "Failed to save alert and announcement" });
  }
});

module.exports = router;
