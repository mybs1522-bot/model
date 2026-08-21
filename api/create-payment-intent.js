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

    // 2. Process 7-Day Free Trial Subscription vs Instant Charge
    let paymentIntentId = '';
    let subscriptionId = '';
    let status = 'active';

    if (isTrialFlow) {
      // ── 7-DAY FREE TRIAL SUBSCRIPTION ($20/MONTH AFTER) ──
      let priceId = '';
      try {
        const productList = await stripe.products.list({ active: true, limit: 20 });
        let product = productList.data.find((p) => p.name.includes('AVADA 3D') || p.name.includes('Pro VIP'));
        if (!product) {
          product = await stripe.products.create({
            name: 'AVADA 3D Pro VIP Membership',
            description: 'Unlimited access to 15,000+ SketchUp (.SKP) scene models, 8K PBR textures, and weekly releases.',
          });
        }

        const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
        const monthlyPrice = priceList.data.find(
          (p) => p.recurring?.interval === 'month' && p.unit_amount === 2000
        );
        if (monthlyPrice) {
          priceId = monthlyPrice.id;
        } else {
          const createdPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: 2000, // $20.00
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
          });
          priceId = createdPrice.id;
        }
      } catch (prodErr) {
        console.warn('Product/price catalog note:', prodErr.message);
      }

      if (priceId) {
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          trial_period_days: 7,
          default_payment_method: payment_method_id,
          payment_settings: {
            save_default_payment_method: 'on_subscription',
          },
          description: 'AVADA 3D Pro VIP - 7-Day Free Trial ($20/month after that)',
          metadata: {
            plan: plan || '7_day_trial_20_month',
            email: normalizedEmail,
          },
        });

        subscriptionId = subscription.id;
        status = subscription.status;
      }
    } else {
      // ── REGULAR PAYMENT (e.g. $20.00 Lifetime Activation) ──
      const chargeAmount = Math.max(100, Math.round(Number(amount || 2000)));
      const paymentIntent = await stripe.paymentIntents.create({
        amount: chargeAmount,
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
        description: `AVADA 3D - ${plan || 'Pro VIP Access'} ($${(chargeAmount / 100).toFixed(2)})`,
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
      subscriptionId,
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
