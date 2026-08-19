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
    const { amount, email, payment_method_id, plan } = body || {};

    if (!amount || !payment_method_id) {
      return res.status(400).json({ error: 'Missing required parameters (amount, payment_method_id)' });
    }

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

      // Attach payment method to customer for 1-click future upsell
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

    // 2. Create & Confirm PaymentIntent directly on-page
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount)),
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
      description: `AVADA 3D - ${plan || '20 Models Starter Pack'} ($${(amount / 100).toFixed(2)})`,
    });

    // 3. Send instant download delivery email via Resend (non-blocking)
    if (normalizedEmail) {
      sendDeliveryEmail(normalizedEmail, plan || 'starter').catch((emailErr) => {
        console.error('Email sending error in create-payment-intent:', emailErr);
      });
    }

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      customerId,
      paymentMethodId: payment_method_id,
    });
  } catch (err) {
    console.error('Stripe API error:', err);
    return res.status(500).json({
      error: err.message || 'Payment processing failed',
      type: err.type,
      code: err.code,
    });
  }
}
