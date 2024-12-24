const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const initializeDatabase = async () => {
  // First connect to postgres database to create/drop our app database
  const adminPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'vervedb123#',
    port: 5433,
    database: 'postgres'
  });

  try {
    console.log('Checking database existence...');
    
    // First, terminate all connections to the database
    try {
      await adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'verve_db'
        AND pid <> pg_backend_pid();
      `);
      console.log('Terminated existing connections');
    } catch (err) {
      console.log('No existing connections to terminate');
    }

    // Drop the database if it exists
    await adminPool.query('DROP DATABASE IF EXISTS verve_db');
    console.log('Dropped existing database');

    // Create the database
    await adminPool.query('CREATE DATABASE verve_db');
    console.log('Created new database');

    // Close the admin connection
    await adminPool.end();

    // Connect to our new database
    const appPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'verve_db',
      password: 'vervedb123#',
      port: 5433
    });

    // Read and execute the SQL file
    const sqlFile = await fs.readFile(path.join(__dirname, 'db', 'init.sql'), 'utf8');
    await appPool.query(sqlFile);
    console.log('Database schema initialized successfully');

    await appPool.end();
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
};

initializeDatabase();
