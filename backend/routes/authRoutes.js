const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authController = require("../controllers/authController");

const router = express.Router();

// Setup upload for signup and profile update
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({ storage });

// AUTH & USER ROUTES
router.post("/send-verification-code", authController.sendVerificationCode);
router.post("/signup", upload.single("uploadID"), authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/confirm-email/:token", authController.confirmEmail);
router.post("/reset-password/token/:token", authController.resetPassword);
router.post("/reset-password/:userId", authController.resetPasswordById);
router.post("/find-user", authController.findUserByEmail);
router.get("/user/:userId", authController.getUserById);
router.put("/user/:userId", upload.single("profileImage"), authController.updateUser);

module.exports = router;
