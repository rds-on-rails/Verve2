const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  // Connect to postgres to create/drop database
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'vervedb123#',
    port: 5433,
    database: 'verve_db'
  });

  try {
    console.log('Checking database existence...');
    
    // Check if database exists
    const dbCheckResult = await pool.query(
      "SELECT datname FROM pg_database WHERE datname = 'verve_db'"
    );

    if (dbCheckResult.rows.length > 0) {
      // Terminate all connections to the database
      console.log('Terminating existing connections');
      await pool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'verve_db'
        AND pid <> pg_backend_pid();
      `);

      // Drop the existing database
      await pool.query('DROP DATABASE verve_db;');
      console.log('Dropped existing database');
    }

    // Create database
    await pool.query('CREATE DATABASE verve_db;');
    console.log('Created new database');

    // Close connection to postgres database
    await pool.end();

    // Connect to verve_db to create schema
    const vervePool = new Pool({
      user: 'postgres',
      host: 'localhost',
      password: 'vervedb123#',
      port: 5433,
      database: 'verve_db'
    });

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'db', 'init.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await vervePool.query(schema);
    console.log('Database schema initialized successfully');

    await vervePool.end();
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

initializeDatabase();
