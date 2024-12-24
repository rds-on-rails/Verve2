// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Allow frontend requests
  credentials: true
}));

// Add this to server.js
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

const PORT = 3001; // Fixed port for backend
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}`);
  console.log('Frontend should be configured to use this port for API requests');
});
