const Stripe = require('stripe');
const { validationResult } = require('express-validator');
const Job = require('../models/Job');
const Payment = require('../models/Payment');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function createIntent(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured on the server',
      });
    }

    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (job.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Job is already paid' });
    }

    const amountCents = Math.round(job.price * 100);
    if (amountCents < 50) {
      return res.status(400).json({ success: false, message: 'Amount too small' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        jobId: job._id.toString(),
        customerId: req.user._id.toString(),
      },
    });

    job.stripePaymentIntentId = paymentIntent.id;
    await job.save();

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (err) {
    console.error(err);
    if (
      err.type === 'StripeAuthenticationError' ||
      /invalid api key/i.test(err.message || '')
    ) {
      return res.status(503).json({
        success: false,
        message:
          'Stripe secret key is invalid. Replace STRIPE_SECRET_KEY in server/.env with a real sk_test_ key from dashboard.stripe.com',
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Could not create payment',
    });
  }
}

async function handleWebhook(req, res) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !whSecret) {
    return res.status(503).send('Stripe webhook not configured');
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error('Webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const jobId = pi.metadata?.jobId;
      if (!jobId) {
        return res.json({ received: true });
      }

      const job = await Job.findById(jobId);
      if (!job) {
        return res.json({ received: true });
      }

      job.paymentStatus = 'paid';
      job.stripePaymentId = pi.id;
      job.stripePaymentIntentId = pi.id;
      await job.save();

      const amount = pi.amount_received / 100;
      const workerEarning = Math.round(amount * 0.85 * 100) / 100;
      const platformFee = Math.round(amount * 0.15 * 100) / 100;

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        {
          job: job._id,
          customer: job.customer,
          worker: null,
          amount,
          currency: pi.currency || 'usd',
          status: 'completed',
          stripePaymentIntentId: pi.id,
          workerEarning,
          platformFee,
        },
        { upsert: true, new: true }
      );
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: 'failed' },
        { upsert: false }
      );
    }

    return res.json({ received: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Webhook handler error' });
  }
}

async function paymentHistory(req, res) {
  try {
    const query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'worker') {
      query.worker = req.user._id;
    } else if (req.user.role === 'admin') {
      // no filter — caller may use admin list endpoint for full table
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate('job', 'title status')
      .populate('customer', 'name email')
      .populate('worker', 'name email')
      .limit(200);

    return res.json({ success: true, data: { payments } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load payments' });
  }
}

module.exports = { createIntent, handleWebhook, paymentHistory };
