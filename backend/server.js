// server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const {
  helmet,
  generalLimiter,
  csrfProtection
} = require('./middleware/security');

const app = express();

// Security middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Apply rate limiting to all routes
app.use(generalLimiter);

// Generate CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Add this to server.js
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3001; // Fixed port for backend
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}`);
  console.log('Frontend should be configured to use this port for API requests');
});
