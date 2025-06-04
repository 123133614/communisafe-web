const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Route imports
const authRoutes = require("./routes/authRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const floodRoutes = require("./routes/floodRoutes");
const incidentRoutes = require("./routes/incidentRoutes");

// Load .env file
dotenv.config({ path: "../.env" });

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with actual frontend domain in production
    methods: ["GET", "POST"],
  },
});

// Attach io to app for use in controllers
app.set("io", io);

// Socket.IO event listeners
io.on("connection", (socket) => {
  console.log("🔌 User connected via Socket.IO");

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Debug: check if env vars are loaded
console.log("🌐 Email:", process.env.EMAIL_USER);
console.log("🔐 Mongo URI:", process.env.MONGO_URI ? "Loaded ✅" : "❌ Not found");

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/flood", floodRoutes);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
