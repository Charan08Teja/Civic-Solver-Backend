const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');

// 🔥 Import socket initializer (NEW)
const { initSocket } = require('./socket');

const authRoutes = require('./src/routes/authRoutes');
const authMiddleware = require('./src/middleware/authMiddleware');
const issueRoutes = require('./src/routes/issueRoutes');

const app = express();

// Create HTTP server
const server = http.createServer(app);

// 🔥 Initialize Socket.IO (clean way)
initSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// USER routes
app.use('/api/issues', issueRoutes);

// ADMIN routes
app.use('/api/admin', issueRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Civic Solver API running 🚀');
});

// Static files
app.use('/uploads', express.static('uploads'));

// Protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected route accessed',
    user: req.user
  });
});

// Start server
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});