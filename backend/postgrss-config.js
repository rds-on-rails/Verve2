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
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Successfully connected to database');
  // Test query to verify connection
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Database connection test successful:', result.rows[0]);
  });
});

module.exports = pool;
