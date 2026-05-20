const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");

// ✅ GLOBAL ERROR LOGGING
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

// ✅ Socket setup
const { initSocket } = require("./socket");

// ✅ Routes
const authRoutes = require("./src/routes/authRoutes");
const authMiddleware = require("./src/middleware/authMiddleware");
const issueRoutes = require("./src/routes/issueRoutes");

const app = express();

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Initialize Socket.IO
initSocket(server);

// ✅ Middlewares
app.use(
  cors({
    origin: (origin, callback) => {

      // allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        "http://localhost:5173",
        "https://civic-solver-frontend.vercel.app"
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {

        // allow mobile/expo/vercel preview URLs
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ User routes
app.use("/api/issues", issueRoutes);

// ✅ Admin routes
app.use("/api/admin", issueRoutes);

// ✅ Static uploads
app.use("/uploads", express.static("uploads"));

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Civic Solver API running 🚀");
});

// ✅ Protected route
app.get("/api/protected", authMiddleware, (req, res) => {

  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

// ✅ GLOBAL EXPRESS ERROR HANDLER
app.use((err, req, res, next) => {

  console.error("GLOBAL ERROR:", err);

  res.status(500).json({
    error: err.message || "Internal Server Error"
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});