const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({ storage });


// ✅ POST announcement
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, location, date, time, contact } = req.body;
    const image = req.file ? req.file.filename : null;

    const newAnn = new Announcement({
      title,
      description,
      category,
      location,
      date,
      time,
      contact,
      image,
    });

    await newAnn.save();

    const io = req.app.get("io");
    io.emit("newNotification", {
      type: "Community Announcements",
      message: `📢 ${title} - ${location}`,
      time: new Date().toLocaleTimeString()
    });

    res.status(201).json(newAnn);
  } catch (err) {
    console.error("❌ Announcement error:", err);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});


// ✅ GET all announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});


// ✅ PUT update announcement by ID (EDIT)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, location, date, time, contact } = req.body;

    const updateFields = {
      title,
      description,
      category,
      location,
      date,
      time,
      contact,
    };

    if (req.file) {
      updateFields.image = req.file.filename;
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: "Failed to update announcement" });
  }
});


// ✅ DELETE announcement
router.delete("/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

module.exports = router;
