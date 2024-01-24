// backend/postgres-config.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT, 
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    }
    });
  
module.exports = pool;
