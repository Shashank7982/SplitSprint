const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { createPaymentIntent, confirmPayment, getMyTransactions } = require('../controllers/payment.controller');
const { createPaymentIntentRules, confirmPaymentRules } = require('../middleware/validate');

const router = express.Router();

// Apply JWT protection middleware
router.use(protect);

router.post('/intent', createPaymentIntentRules, createPaymentIntent);
router.post('/confirm', confirmPaymentRules, confirmPayment);
router.get('/my-transactions', getMyTransactions);

module.exports = router;
