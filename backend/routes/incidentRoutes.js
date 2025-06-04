// backend/incidentRoutes.js
const express = require('express');
const router = express.Router();
const incidentController = require("../controllers/incidentController");
const multer = require('multer');

// Set up multer storage if you haven't yet
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this path exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ✅ This is the correct way
router.post('/', upload.single('image'), incidentController.createIncident);

router.get('/', async (req, res) => {
  try {
    const Incident = require('./Incident');
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    console.error("❌ Error fetching incidents:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
