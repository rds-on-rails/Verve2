const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const validator = require('express-validator');

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: 'Too many attempts, please try again later'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // limit each IP to 100 requests per windowMs for general routes
});

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Input validation middleware
const validateSignup = [
  validator.body('email').isEmail().normalizeEmail(),
  validator.body('password').isLength({ min: 6 }).optional(),
  validator.body('name').trim().notEmpty(),
];

const validateSignin = [
  validator.body('email').isEmail().normalizeEmail(),
  validator.body('password').notEmpty(),
];

const validateProfile = [
  validator.body('name').trim().notEmpty(),
  validator.body('email').isEmail().normalizeEmail(),
];

const validateResetPassword = [
  validator.body('token').notEmpty(),
  validator.body('newPassword').isLength({ min: 6 }),
];

module.exports = {
  authLimiter,
  generalLimiter,
  csrfProtection,
  validateSignup,
  validateSignin,
  validateProfile,
  validateResetPassword,
  helmet
};
