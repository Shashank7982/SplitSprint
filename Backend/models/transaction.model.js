const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  poolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['contributor_debit', 'host_payout', 'refund'],
    required: true
  },
  amount: {
    type: Number, // in cents
    required: [true, 'Transaction amount is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  stripePaymentIntentId: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
