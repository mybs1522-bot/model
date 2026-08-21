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
    const { amount, email, payment_method_id, plan, is_trial, plan_cycle } = body || {};

    if (!payment_method_id) {
      return res.status(400).json({ error: 'Missing required parameter: payment_method_id' });
    }

    const isTrialFlow = is_trial === true || amount === 0 || plan?.includes('trial');
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const isYearly = Boolean(
      plan_cycle === 'yearly' ||
      (typeof plan === 'string' && (plan.includes('yearly') || plan.includes('180')))
    );
    const targetUnitAmount = isYearly ? 18000 : 2000; // $180.00 or $20.00
    const targetInterval = isYearly ? 'year' : 'month';
    const planDesc = isYearly
      ? 'AVADA 3D Pro VIP - 7-Day Free Trial ($180/year after that • 25% OFF)'
      : 'AVADA 3D Pro VIP - 7-Day Free Trial ($20/month after that)';

    // 1. Find or create Stripe customer
    let customerId = '';
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
      // ── CARD FUND & ACTIVE STATUS VERIFICATION ($1.00 Pre-Auth Hold & Immediate Void) ──
      // Forces the issuing bank to verify real available balance. Burner/$0 cards get rejected instantly!
      let verifyIntent = null;
      try {
        verifyIntent = await stripe.paymentIntents.create({
          amount: 100, // $1.00 verification hold
          currency: 'usd',
          customer: customerId,
          payment_method: payment_method_id,
          capture_method: 'manual', // Hold only, not captured
          confirm: true,
          setup_future_usage: 'off_session',
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
          description: 'AVADA 3D - Active Card Verification ($0.00 Charged)',
        });

        // Immediately cancel/release the $1 hold so the user pays $0.00 today
        if (verifyIntent && verifyIntent.id) {
          await stripe.paymentIntents.cancel(verifyIntent.id).catch((cErr) => {
            console.warn('Pre-auth release note:', cErr.message);
          });
        }
      } catch (verifyErr) {
        console.error('Card verification decline:', verifyErr.message);
        return res.status(400).json({
          error: 'Card Authorization Failed! Use a different card.',
          code: verifyErr.code,
          decline_code: verifyErr.decline_code,
        });
      }

      // ── 7-DAY FREE TRIAL SUBSCRIPTION ($20/MO OR $180/YR) ──
      const MONTHLY_PRICE_ID = 'price_1U6zDTGGsoQTkhyvOU4AS6u0'; // $20.00 / month
      const YEARLY_PRICE_ID = 'price_1U70HFGGsoQTkhyvN9A2wPkv';  // $180.00 / year (25% OFF)
      let priceId = isYearly ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;

      try {
        if (!priceId) {
          const productList = await stripe.products.list({ active: true, limit: 20 });
          let product = productList.data.find((p) => p.name.includes('AVADA 3D') || p.name.includes('Pro VIP'));
          if (!product) {
            product = await stripe.products.create({
              name: 'AVADA 3D Pro VIP Membership',
              description: 'Unlimited access to 15,000+ SketchUp (.SKP) scene models, 8K PBR textures, and weekly releases.',
            });
          }

          const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
          const matchedPrice = priceList.data.find(
            (p) => p.recurring?.interval === targetInterval && p.unit_amount === targetUnitAmount
          );
          if (matchedPrice) {
            priceId = matchedPrice.id;
          } else {
            const createdPrice = await stripe.prices.create({
              product: product.id,
              unit_amount: targetUnitAmount,
              currency: 'usd',
              recurring: {
                interval: targetInterval,
              },
            });
            priceId = createdPrice.id;
          }
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
            payment_method_types: ['card'],
          },
          description: planDesc,
          metadata: {
            plan: plan || (isYearly ? '7_day_trial_180_year' : '7_day_trial_20_month'),
            email: normalizedEmail,
            plan_cycle: isYearly ? 'yearly' : 'monthly',
          },
          expand: ['pending_setup_intent', 'latest_invoice.payment_intent'],
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
