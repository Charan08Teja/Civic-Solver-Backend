const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");

// Socket setup
const { initSocket } = require("./socket");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const authMiddleware = require("./src/middleware/authMiddleware");
const issueRoutes = require("./src/routes/issueRoutes");

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middlewares
app.use(
  cors({
    origin: "YOUR_VERCEL_FRONTEND_URL", // example: https://civic-solver.vercel.app
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// User routes
app.use("/api/issues", issueRoutes);

// Admin routes
app.use("/api/admin", issueRoutes);

// Static files
app.use("/uploads", express.static("uploads"));

// Test route
app.get("/", (req, res) => {
  res.send("Civic Solver API running 🚀");
});

// Protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});