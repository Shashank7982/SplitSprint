const Pool = require('../models/pool.model');
const Transaction = require('../models/transaction.model');
const { recalculateUserTrustScore } = require('../services/trust.service');

// Helper: Reconcile payments for a pool to trigger host payout & roll billing date
const reconcilePoolPayments = async (poolId) => {
  const pool = await Pool.findById(poolId);
  if (!pool || pool.status !== 'active') return;

  // 1. Identify active contributors
  const activeContributors = pool.members.filter(m => m.role === 'contributor' && m.status === 'active');
  
  // If there are no contributors yet, nothing to reconcile
  if (activeContributors.length === 0) return;

  const contributorIds = activeContributors.map(m => m.userId.toString());

  // 2. Calculate the current billing cycle start date
  const cycleStart = new Date(pool.nextBillingDate);
  if (pool.billingCycle === 'annual') {
    cycleStart.setFullYear(cycleStart.getFullYear() - 1);
  } else {
    cycleStart.setMonth(cycleStart.getMonth() - 1);
  }

  // 3. Find all completed contributor debit transactions in the current billing cycle
  const completedTxs = await Transaction.find({
    poolId: pool._id,
    userId: { $in: contributorIds },
    type: 'contributor_debit',
    status: 'completed',
    createdAt: { $gte: cycleStart }
  });

  const paidUserIds = new Set(completedTxs.map(tx => tx.userId.toString()));
  const allPaid = contributorIds.every(id => paidUserIds.has(id));

  // 4. Trigger host payout and roll billing date if all contributors have paid
  if (allPaid) {
    console.log(`[Reconciliation] All contributors paid for pool ${poolId}. Triggering payout.`);

    const payoutAmount = Math.round(pool.totalCost * 0.95);

    const payoutTx = new Transaction({
      poolId: pool._id,
      userId: pool.hostId,
      type: 'host_payout',
      amount: payoutAmount,
      status: 'completed'
    });
    await payoutTx.save();

    // Roll next billing date forward
    const nextDate = new Date(pool.nextBillingDate);
    if (pool.billingCycle === 'annual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    pool.nextBillingDate = nextDate;
    await pool.save();
  }
};

// Simulate a mock/simple card payment (completely bypassing Stripe)
const createPaymentIntent = async (req, res, next) => {
  const { poolId } = req.body;
  const userId = req.userId;

  try {
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    const isMember = pool.members.some(m => m.userId.toString() === userId && m.status === 'active');
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this pool' });
    }

    const amount = pool.shareAmount;
    const transactionId = `pi_simulated_${Math.random().toString(36).substr(2, 12)}`;

    // Create a completed transaction directly
    const transaction = new Transaction({
      poolId: pool._id,
      userId,
      type: 'contributor_debit',
      amount,
      status: 'completed',
      stripePaymentIntentId: transactionId
    });

    await transaction.save();

    // Reward user +2 trust score
    await recalculateUserTrustScore(userId);

    // Reconcile pool billing
    await reconcilePoolPayments(pool._id);

    res.status(200).json({
      success: true,
      message: 'Simulated payment completed successfully',
      clientSecret: 'simulated_secret',
      stripePaymentIntentId: transactionId,
      transactionId: transaction._id,
      amount
    });
  } catch (error) {
    next(error);
  }
};

// Simple legacy confirm route for compatibility (in case frontend calls it)
const confirmPayment = async (req, res, next) => {
  const { stripePaymentIntentId } = req.body;

  try {
    const transaction = await Transaction.findOne({ stripePaymentIntentId });
    if (!transaction) {
      return res.status(200).json({ success: true, message: 'Payment simulated successfully' });
    }

    if (transaction.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Payment already completed', transaction });
    }

    transaction.status = 'completed';
    await transaction.save();
    await recalculateUserTrustScore(transaction.userId);
    await reconcilePoolPayments(transaction.poolId);

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// Get all transactions for the current user
const getMyTransactions = async (req, res, next) => {
  const userId = req.userId;
  try {
    const transactions = await Transaction.find({ userId })
      .populate('poolId', 'serviceName planTier shareAmount')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  reconcilePoolPayments,
  getMyTransactions
};
