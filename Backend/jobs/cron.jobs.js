const cron = require('node-cron');
const Pool = require('../models/pool.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const { recalculateUserTrustScore } = require('../services/trust.service');

// 1. Billing Reminder Job
const runBillingReminder = async () => {
  console.log('[Cron Job: Billing Reminder] Running...');
  try {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const pools = await Pool.find({
      status: 'active',
      nextBillingDate: { $gte: tomorrowStart, $lte: tomorrowEnd }
    });

    console.log(`[Cron Job: Billing Reminder] Found ${pools.length} pools billing tomorrow.`);

    for (const pool of pools) {
      const activeContributors = pool.members.filter(m => m.role === 'contributor' && m.status === 'active');
      for (const contributor of activeContributors) {
        console.log(`[Reminder] Billing warning sent to user ${contributor.userId} for pool ${pool._id} (${pool.serviceName})`);
        
        // Optional: Pre-create a "pending" transaction record if one doesn't exist
        const existingTx = await Transaction.findOne({
          poolId: pool._id,
          userId: contributor.userId,
          type: 'contributor_debit',
          status: 'pending',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingTx) {
          const tx = new Transaction({
            poolId: pool._id,
            userId: contributor.userId,
            type: 'contributor_debit',
            amount: pool.shareAmount,
            status: 'pending'
          });
          await tx.save();
          console.log(`[Reminder] Pre-created pending transaction for member ${contributor.userId} in pool ${pool._id}`);
        }
      }
    }
  } catch (error) {
    console.error('[Cron Job: Billing Reminder] Error:', error.message);
  }
};

// 2. Retry Failed Payments Job
const runRetryFailedPayments = async (mockSuccessOverride = null) => {
  console.log('[Cron Job: Retry Failed Payments] Running...');
  try {
    // Find failed transactions with retryCount < 3
    const failedTxs = await Transaction.find({
      status: 'failed',
      retryCount: { $lt: 3 },
      type: 'contributor_debit'
    });

    console.log(`[Cron Job: Retry Failed Payments] Found ${failedTxs.length} failed transactions to retry.`);

    for (const tx of failedTxs) {
      console.log(`[Retry] Retrying transaction ${tx._id} (Attempt ${tx.retryCount + 1}/3)`);

      let success = false;
      let newPaymentIntentId = '';

      const user = await User.findById(tx.userId);
      const pool = await Pool.findById(tx.poolId);

      if (process.env.STRIPE_SECRET_KEY && tx.stripePaymentIntentId && !tx.stripePaymentIntentId.startsWith('pi_mock_')) {
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          const oldIntent = await stripe.paymentIntents.retrieve(tx.stripePaymentIntentId);
          if (oldIntent.customer && oldIntent.payment_method) {
            const newIntent = await stripe.paymentIntents.create({
              amount: tx.amount,
              currency: 'inr',
              customer: oldIntent.customer,
              payment_method: oldIntent.payment_method,
              confirm: true,
              off_session: true
            });
            if (newIntent.status === 'succeeded') {
              success = true;
              newPaymentIntentId = newIntent.id;
            }
          }
        } catch (stripeError) {
          console.error(`[Retry] Stripe charge failed for transaction ${tx._id}:`, stripeError.message);
        }
      } else {
        // Fallback: Simulation mode
        // For demonstration/testing, mockSuccessOverride can force outcome
        success = mockSuccessOverride !== null ? mockSuccessOverride : Math.random() < 0.5;
        newPaymentIntentId = `pi_mock_retry_${Math.random().toString(36).substr(2, 10)}`;
      }

      if (success) {
        console.log(`[Retry] Transaction ${tx._id} retry succeeded!`);
        tx.status = 'completed';
        if (newPaymentIntentId) {
          tx.stripePaymentIntentId = newPaymentIntentId;
        }
        await tx.save();

        // Recalculate user trust score (+1 for successful retry)
        await recalculateUserTrustScore(tx.userId);
      } else {
        // Increment retryCount
        tx.retryCount += 1;
        
        if (tx.retryCount >= 3) {
          console.log(`[Retry] Transaction ${tx._id} failed after maximum retry attempts. Flagging as defaulted.`);
          // Status remains failed, but retryCount has hit 3.
          await tx.save();

          // Flag user's membership status as defaulted in the pool
          if (pool) {
            const memberIndex = pool.members.findIndex(m => m.userId.toString() === tx.userId.toString());
            if (memberIndex !== -1) {
              pool.members[memberIndex].status = 'defaulted';
              await pool.save();
              console.log(`[Retry] User ${tx.userId} membership in pool ${pool._id} flagged as 'defaulted'.`);
            }
          }

          // Recalculate score (handles the failed payments and defaulted pools penalties)
          await recalculateUserTrustScore(tx.userId);
        } else {
          await tx.save();
          console.log(`[Retry] Transaction ${tx._id} failed. Incrementing retryCount to ${tx.retryCount}.`);
        }
      }
    }
  } catch (error) {
    console.error('[Cron Job: Retry Failed Payments] Error:', error.message);
  }
};

// Start scheduled jobs
const startCronJobs = () => {
  // Billing Reminder runs daily at 9:00 AM
  cron.schedule('0 9 * * *', runBillingReminder);
  console.log('[Cron] Billing Reminder Job scheduled for 09:00 AM daily.');

  // Retry Failed Payments runs daily at 10:00 AM
  cron.schedule('0 10 * * *', runRetryFailedPayments);
  console.log('[Cron] Retry Failed Payments Job scheduled for 10:00 AM daily.');
};

module.exports = {
  startCronJobs,
  runBillingReminder,
  runRetryFailedPayments
};
