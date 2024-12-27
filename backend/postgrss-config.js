// backend/postgres-config.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
    user: 'postgres',
    host: 'localhost',
    database: 'verve_db',
    password: 'vervedb123#',
    port: 5433,
    ssl: false
});

// Test the database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Successfully connected to database');
    console.log('Database connection test successful:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err.stack);
  }
};

testConnection();

module.exports = pool;
