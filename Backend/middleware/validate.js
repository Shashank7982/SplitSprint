const { body, validationResult } = require('express-validator');

// Validation runner middleware
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const registerRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validateResults
];

const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateResults
];

const createPoolRules = [
  body('serviceName')
    .trim()
    .notEmpty()
    .withMessage('Service name is required'),
  body('planTier')
    .trim()
    .optional(),
  body('totalCost')
    .isInt({ min: 1 })
    .withMessage('Total cost must be a positive integer (in cents)'),
  body('billingCycle')
    .isIn(['monthly', 'annual'])
    .withMessage('Billing cycle must be either monthly or annual'),
  body('slots')
    .isInt({ min: 2, max: 6 })
    .withMessage('Slots capacity must be between 2 and 6'),
  validateResults
];

const joinPoolRules = [
  body('inviteCode')
    .trim()
    .isLength({ min: 8, max: 8 })
    .withMessage('Invite code must be exactly 8 characters long'),
  validateResults
];

const createPaymentIntentRules = [
  body('poolId')
    .trim()
    .isMongoId()
    .withMessage('A valid poolId is required'),
  validateResults
];

const confirmPaymentRules = [
  body('stripePaymentIntentId')
    .trim()
    .notEmpty()
    .withMessage('Stripe PaymentIntent ID is required'),
  validateResults
];

module.exports = {
  registerRules,
  loginRules,
  createPoolRules,
  joinPoolRules,
  createPaymentIntentRules,
  confirmPaymentRules
};
