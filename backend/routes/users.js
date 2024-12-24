// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../postgrss-config'); 
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Verve!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Verve! 🎉</h1>
        <p>Dear ${name},</p>
        <p>Thank you for joining Verve! We're excited to have you as part of our community.</p>
        <p>Get started by exploring our features and completing your profile.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Verve Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Sign-up route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, isGoogleSignup } = req.body;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    if (!isGoogleSignup && (!password || !name)) {
      return res.status(400).json({ message: "Name and password are required for email signup" });
    }

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length) {
      return res.status(409).json({ message: "User already exists" });
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Insert the new user with name
    const newUser = await pool.query(
      'INSERT INTO users (email, password, name, is_google_signup, profile_completed, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role',
      [email, hashedPassword, name, isGoogleSignup, false, 'USER']
    );

    // Create a token
    const token = jwt.sign({ id: newUser.rows[0].id, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue with signup process even if email fails
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name,
        role: newUser.rows[0].role,
        profileCompleted: false
      },
      token,
      redirectTo: '/update-profile'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Sign-in route
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: "Sign in successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profile_completed
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing in" });
  }
});

// Google sign-in route
router.post('/google-signin', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name, sub: googleId } = ticket.getPayload();

    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "User not found. Please sign up first.",
        shouldSignUp: true 
      });
    }

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Google sign-in successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profile_completed
      },
      token
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ message: 'Error with Google authentication' });
  }
});

// Google signup route
router.post('/google-signup', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name, sub: googleId } = ticket.getPayload();

    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return res.status(409).json({ message: "User already exists. Please sign in instead." });
    }

    // Create new user
    result = await pool.query(
      'INSERT INTO users (name, email, is_google_signup, google_id, role, profile_completed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, true, googleId, 'USER', true]
    );
    
    const user = result.rows[0];

    // Send welcome email for new users
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue with signup process even if email fails
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Google signup successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profile_completed
      },
      token
    });
  } catch (error) {
    console.error('Google signup error:', error);
    res.status(500).json({ message: 'Error with Google authentication' });
  }
});

// Update profile route
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already taken' });
    }

    // Update user profile
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, profile_completed = true, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, email, role, profile_completed',
      [name, email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profileCompleted: updatedUser.profile_completed
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get all users (admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, is_google_signup, profile_completed, created_at FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Forgot password route
router.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetTokenExpiry, email]
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Password reset instructions sent to your email" });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      res.status(500).json({ message: "Error sending reset email. Please try again later." });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password route
router.post('/resetpassword', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = $2',
      [hashedPassword, token]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "Error resetting password" });
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

// Subscribe route
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    let stripeCustomerId = user.stripe_customer_id;

    // If user doesn't have a Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, userId]
      );
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user subscription status
    await pool.query(
      'UPDATE users SET subscription_status = $1, subscription_plan = $2, subscription_end_date = to_timestamp($3) WHERE id = $4',
      ['ACTIVE', 'PRO', subscription.current_period_end, userId]
    );

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Error processing subscription' });
  }
});

module.exports = router;
