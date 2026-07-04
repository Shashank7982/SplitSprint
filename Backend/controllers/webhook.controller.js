const Transaction = require('../models/transaction.model');
const { recalculateUserTrustScore } = require('../services/trust.service');
const { reconcilePoolPayments } = require('./payment.controller');

// Stripe Webhook Event Listener Route Handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // 1. Verify webhook signature or parse mock event in dev mode
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && sig && sig !== 'mock_signature') {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Fallback parsing for mock tests
    try {
      const payloadString = req.body.toString();
      event = JSON.parse(payloadString);
    } catch (err) {
      console.error('[Stripe Webhook] Mock parsing failed:', err.message);
      return res.status(400).send(`Mock Webhook JSON Parse Error: ${err.message}`);
    }
  }

  console.log(`[Stripe Webhook] Received event type: ${event.type}`);

  try {
    // 2. Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        
        // Find corresponding transaction
        const transaction = await Transaction.findOne({ stripePaymentIntentId: intent.id });
        if (transaction && transaction.status !== 'completed') {
          transaction.status = 'completed';
          await transaction.save();

          // Reward user trust points (+2 for on-time, +1 for retry)
          await recalculateUserTrustScore(transaction.userId);

          // Reconcile pool billing (check if host payout is triggered)
          await reconcilePoolPayments(transaction.poolId);
          console.log(`[Stripe Webhook] PaymentIntent succeeded, updated Transaction: ${transaction._id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        
        const transaction = await Transaction.findOne({ stripePaymentIntentId: intent.id });
        if (transaction && transaction.status !== 'failed') {
          transaction.status = 'failed';
          await transaction.save();

          // Deduct user trust points if failed
          await recalculateUserTrustScore(transaction.userId);
          console.log(`[Stripe Webhook] PaymentIntent failed, updated Transaction: ${transaction._id}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;

        const transaction = await Transaction.findOne({ stripePaymentIntentId: charge.payment_intent });
        if (transaction && transaction.status !== 'refunded') {
          transaction.status = 'refunded';
          await transaction.save();
          console.log(`[Stripe Webhook] Charge refunded, updated Transaction: ${transaction._id}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Always send 200 response to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Handler error:', error.message);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};

module.exports = {
  handleStripeWebhook
};
