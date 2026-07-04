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

    // Platform fee is 5%, host receives 95% of totalCost
    const payoutAmount = Math.round(pool.totalCost * 0.95);

    const payoutTx = new Transaction({
      poolId: pool._id,
      userId: pool.hostId,
      type: 'host_payout',
      amount: payoutAmount,
      status: 'completed'
    });
    await payoutTx.save();

    // Roll next billing date forward by 1 month or 1 year (assigning new Date to trigger Mongoose dirty tracking)
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

// Create Stripe PaymentIntent or mock client secret
const createPaymentIntent = async (req, res, next) => {
  const { poolId } = req.body;
  const userId = req.userId; // Contributor making the payment

  try {
    // 1. Fetch pool and verify membership
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    const isMember = pool.members.some(m => m.userId.toString() === userId && m.status === 'active');
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this pool' });
    }

    // 2. Fetch user details to get Stripe customer ID
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const amount = pool.shareAmount; // User's monthly share in cents

    let clientSecret = '';
    let stripePaymentIntentId = '';

    // 3. Create Stripe PaymentIntent if credentials are set, otherwise use mock fallback
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Auto-provision a real Stripe customer if the stored ID is fake/missing
        let stripeCustomerId = user.stripeCustomerId;
        const isMockCustomer = !stripeCustomerId || stripeCustomerId.startsWith('cus_mock_');

        if (isMockCustomer) {
          const customer = await stripe.customers.create({
            name: user.name,
            email: user.email,
            metadata: { userId: userId.toString() }
          });
          stripeCustomerId = customer.id;
          user.stripeCustomerId = stripeCustomerId;
          await user.save();
          console.log(`[Stripe] Created real customer ${stripeCustomerId} for user ${user.email}`);
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'inr',
          customer: stripeCustomerId,
          metadata: {
            poolId: pool._id.toString(),
            userId: userId.toString()
          }
        });
        clientSecret = paymentIntent.client_secret;
        stripePaymentIntentId = paymentIntent.id;
      } catch (stripeError) {
        console.error('Stripe PaymentIntent creation failed, falling back to mock mode:', stripeError.message);
      }
    }

    // Fallback to Mock Payment Mode
    if (!stripePaymentIntentId) {
      stripePaymentIntentId = `pi_mock_${Math.random().toString(36).substr(2, 12)}`;
      clientSecret = `${stripePaymentIntentId}_secret_${Math.random().toString(36).substr(2, 6)}`;
    }

    // 4. Create and save pending Transaction
    const transaction = new Transaction({
      poolId: pool._id,
      userId,
      type: 'contributor_debit',
      amount,
      status: 'pending',
      stripePaymentIntentId
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      clientSecret,
      stripePaymentIntentId,
      transactionId: transaction._id,
      amount
    });
  } catch (error) {
    next(error);
  }
};

// Manual confirmation fallback (Mock Checkout trigger for local testing)
const confirmPayment = async (req, res, next) => {
  const { stripePaymentIntentId } = req.body;

  try {
    const transaction = await Transaction.findOne({ stripePaymentIntentId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Payment already completed', transaction });
    }

    // Update status to completed
    transaction.status = 'completed';
    await transaction.save();

    // Reward user +2 trust score
    await recalculateUserTrustScore(transaction.userId);

    // Reconcile pool billing
    await reconcilePoolPayments(transaction.poolId);

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully (Mock confirmation)',
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
