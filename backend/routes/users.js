// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const { Pool } = require('pg');
require('dotenv').config();
const pool = require('../postgrss-config'); // Assuming you export your pool from db.js

// const pool = new Pool({
//   HOST: '127.0.0.1',
//   USER: 'postgres',
//   PASSWORD: 'Aptos@321',
//   DB: 'verve_dev',
//   dialect: "postgres",
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
//   ssl: {
//     rejectUnauthorized: false // 
//   }
//   });


// Sign-up route
router.post('/signup', async (req, res) => {
  try {
    console.log(req.body, 'this is req.body');
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(email, password, hashedPassword, 'this is email, password, hashedPassword');
    console.log(pool, 'this is pool');
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Insert the new user
    const newUser = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    // Create a token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with the new user's email and token
    res.status(201).json({
      user: {
        email: newUser.rows[0].email,
        token: token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
//create a forgot password route
router.post('/forgotpassword', async (req, res) => {
  try {
    console.log(req.body, 'this is req.body');
    const { email } = req.body;
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!userExists.rows.length) {
      return res.status(409).json({ message: "User does not exists" });
    }
    // Create a token
    const token = jwt.sign({ id: userExists.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Respond with the new user's email and token
    res.status(201).json({
      user: {
        email: userExists.rows[0].email,
        token: token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
//create a reset password route
router.post('/resetpassword', async (req, res) => {
  try {
    console.log(req.body, 'this is req.body');
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!userExists.rows.length) {
      return res.status(409).json({ message: "User does not exists" });
    }
    // Update the new user
    const newUser = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, email]
    );
    // Create a token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Respond with the new user's email and token
    res.status(201).json({
      user: {
        email: newUser.rows[0].email,
        token: token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Sign-in route
router.post('/signin', async (req, res) => {
  //put sign in logic here
  try {
    console.log(req.body, 'this is req.body in Singin');
    const { email, password } = req.body;
    //
    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!userExists.rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if password is correct
    const validPassword = await bcrypt.compare(password, userExists.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a token
    const token = jwt.sign({ id: userExists.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with the new user's email and token
    res.status(200).json({
      user: {
        email: userExists.rows[0].email,
        token: token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
  // ... Your sign-in logic here
});

module.exports = router;
