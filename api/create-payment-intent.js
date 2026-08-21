import Stripe from 'stripe';
import { sendDeliveryEmail } from './email-helper.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured in Vercel environment variables' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { amount, email, payment_method_id, plan, is_trial } = body || {};

    if (!payment_method_id) {
      return res.status(400).json({ error: 'Missing required parameter: payment_method_id' });
    }

    const isTrialFlow = is_trial === true || amount === 0 || plan?.includes('trial');

    // 1. Find or create Stripe customer
    let customerId = '';
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (normalizedEmail) {
      const existing = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: normalizedEmail,
          description: `AVADA 3D Customer (${normalizedEmail})`,
        });
        customerId = created.id;
      }

      // Attach payment method to customer for 7-day trial and future billing
      try {
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: customerId,
        });
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: payment_method_id,
          },
        });
      } catch (attachErr) {
        console.warn('Payment method attach note:', attachErr.message);
      }
    }

    // 2. Process Trial vs Instant Charge
    let paymentIntentId = '';
    let status = 'succeeded';

    if (isTrialFlow) {
      // ── $0 7-DAY TRIAL FUND VERIFICATION ──
      // Strictly verify the card is active and has available funds ($1 pre-auth hold).
      // If the card is empty/burner, the card issuer immediately rejects with 'insufficient_funds' or 'card_declined'.
      const verifyIntent = await stripe.paymentIntents.create({
        amount: 100, // $1.00 verification check
        currency: 'usd',
        customer: customerId || undefined,
        payment_method: payment_method_id,
        capture_method: 'manual', // Pre-authorization hold only
        confirm: true,
        setup_future_usage: customerId ? 'off_session' : undefined,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        description: `AVADA 3D - 7-Day Free Trial Card Verification ($0 Due Today)`,
      });

      paymentIntentId = verifyIntent.id;

      // Immediately cancel / release the $1 hold so the user is charged $0 today
      try {
        await stripe.paymentIntents.cancel(verifyIntent.id);
      } catch (cancelErr) {
        console.warn('Pre-auth void note:', cancelErr.message);
      }
    } else {
      // ── REGULAR PAYMENT ──
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount || 2900)),
        currency: 'usd',
        customer: customerId || undefined,
        payment_method: payment_method_id,
        confirm: true,
        setup_future_usage: customerId ? 'off_session' : undefined,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        receipt_email: normalizedEmail || undefined,
        description: `AVADA 3D - ${plan || '3,000+ Models VIP Access'} ($${((amount || 2900) / 100).toFixed(2)})`,
      });

      paymentIntentId = paymentIntent.id;
      status = paymentIntent.status;
    }

    // 3. Send instant download delivery email via Resend (non-blocking)
    if (normalizedEmail) {
      sendDeliveryEmail(normalizedEmail, isTrialFlow ? 'vip_trial' : (plan || 'starter')).catch((emailErr) => {
        console.error('Email sending error in create-payment-intent:', emailErr);
      });
    }

    return res.status(200).json({
      success: true,
      isTrial: isTrialFlow,
      paymentIntentId,
      status,
      customerId,
      paymentMethodId: payment_method_id,
    });
  } catch (err) {
    console.error('Stripe API error:', err);
    return res.status(500).json({
      error: err.message || 'Card verification failed. Please check that your card has funds and try again.',
      type: err.type,
      code: err.code,
    });
  }
}
