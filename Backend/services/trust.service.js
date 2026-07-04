const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');

// Recalculates user trust score based on transaction history and defaulted pools, updating the cached value
const recalculateUserTrustScore = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Start with default score of 100
    let score = 100;

    // 1. Check all transaction events
    const transactions = await Transaction.find({ userId });
    for (const tx of transactions) {
      if (tx.status === 'completed') {
        if (tx.retryCount === 0) {
          score += 2; // On-Time Payment: +2
        } else {
          score += 1; // Retry Success: +1
        }
      } else if (tx.status === 'failed' && tx.retryCount >= 3) {
        score -= 10; // Payment Failed: -10
      }
    }

    // 2. Check for pool defaults
    const Pool = require('../models/pool.model');
    const defaultedPools = await Pool.find({
      'members': {
        $elemMatch: {
          userId: userId,
          status: 'defaulted'
        }
      }
    });
    score -= defaultedPools.length * 25; // Pool Default: -25

    // Enforce bounds: [0, 100]
    score = Math.max(0, Math.min(100, score));

    user.trustScore = score;
    await user.save();

    return score;
  } catch (error) {
    console.error(`Error calculating trust score for user ${userId}:`, error.message);
    throw error;
  }
};

module.exports = {
  recalculateUserTrustScore
};
