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
    const { amount, customerId, paymentMethodId, email } = body || {};

    if (!amount) {
      return res.status(400).json({ error: 'Missing amount parameter' });
    }

    let targetCustomerId = customerId;
    let targetPaymentMethodId = paymentMethodId;
    let targetEmail = email ? email.trim().toLowerCase() : '';

    if (!targetCustomerId && targetEmail) {
      const existing = await stripe.customers.list({ email: targetEmail, limit: 1 });
      if (existing.data.length > 0) {
        targetCustomerId = existing.data[0].id;
        const defaultPm = existing.data[0].invoice_settings?.default_payment_method;
        if (defaultPm) {
          targetPaymentMethodId = typeof defaultPm === 'string' ? defaultPm : defaultPm.id;
        }
      }
    } else if (targetCustomerId && !targetEmail) {
      try {
        const customer = await stripe.customers.retrieve(targetCustomerId);
        if (customer && !customer.deleted && customer.email) {
          targetEmail = customer.email;
        }
      } catch (custErr) {
        console.warn('Customer retrieve note:', custErr.message);
      }
    }

    if (!targetCustomerId) {
      return res.status(400).json({ error: 'No saved customer found for this email' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount)),
      currency: 'usd',
      customer: targetCustomerId,
      payment_method: targetPaymentMethodId || undefined,
      off_session: true,
      confirm: true,
      description: 'AVADA 3D - 3,000+ Models VIP Lifetime Upsell ($29.00)',
    });

    // Send instant download delivery email for VIP upsell (non-blocking)
    if (targetEmail) {
      sendDeliveryEmail(targetEmail, 'vip').catch((emailErr) => {
        console.error('Email sending error in charge-saved-card:', emailErr);
      });
    }

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
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
