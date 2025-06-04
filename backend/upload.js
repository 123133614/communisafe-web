// routes.js
const express    = require("express");
const router     = express.Router();
const multer     = require("multer");
const path       = require("path");
const fs         = require("fs");
const controller = require("./controllers");

// ─── Multer setup ─────────────────────────────────────────────────────────────
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({ storage });

// ─── PROFILE routes ───────────────────────────────────────────────────────────
router.get ("/user/:userId", controller.getUserById);
router.put ("/user/:userId",
  upload.single("profileImage"),
  controller.updateUser
);

router.post("/api/auth/login",controller.login);


module.exports = router;
