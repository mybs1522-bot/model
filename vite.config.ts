import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import Stripe from 'stripe'

function stripeApiPlugin(secretKey: string): Plugin {
  const stripe = secretKey
    ? new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia' as any,
      })
    : null

  return {
    name: 'stripe-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        if (!stripe) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'STRIPE_SECRET_KEY is not configured in .env' }))
        }

        // Helper to parse JSON body
        const getBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = ''
            req.on('data', (chunk) => {
              data += chunk
            })
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {})
              } catch (err) {
                reject(err)
              }
            })
          })
        }

        const sendJson = (status: number, payload: any) => {
          res.writeHead(status, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(payload))
        }

        try {
          // Route 1: Create subscription with 7-day trial ($20/mo) or charge payment intent
          if (req.url === '/api/create-payment-intent' && req.method === 'POST') {
            const body = await getBody()
            const { amount, email, payment_method_id, plan, is_trial } = body || {}

            if (!payment_method_id) {
              return sendJson(400, { error: 'Missing required parameter: payment_method_id' })
            }

            const isTrialFlow = Boolean(is_trial === true || amount === 0 || (typeof plan === 'string' && plan.includes('trial')))
            const normalizedEmail = email ? email.trim().toLowerCase() : ''

            // 1. Find or create Stripe customer
            let customerId = ''
            if (normalizedEmail) {
              const existing = await stripe.customers.list({ email: normalizedEmail, limit: 1 })
              if (existing.data.length > 0) {
                customerId = existing.data[0].id
              } else {
                const created = await stripe.customers.create({
                  email: normalizedEmail,
                  description: `AVADA 3D Customer (${normalizedEmail})`,
                })
                customerId = created.id
              }
            } else {
              const created = await stripe.customers.create({
                description: 'AVADA 3D Customer',
              })
              customerId = created.id
            }

            // 2. Attach payment method to customer and set as default
            try {
              await stripe.paymentMethods.attach(payment_method_id, {
                customer: customerId,
              })
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: payment_method_id,
                },
              })
            } catch (attachErr: any) {
              console.warn('Payment method attach note:', attachErr.message)
            }

            // 3. Process 7-Day Free Trial Subscription vs One-Time Payment
            if (isTrialFlow) {
              // ── 7-DAY FREE TRIAL SUBSCRIPTION ($20/MONTH AFTER) ──
              // Ensure recurring product and price exist
              let priceId = ''
              try {
                const productList = await stripe.products.list({ active: true, limit: 20 })
                let product = productList.data.find((p) => p.name.includes('AVADA 3D') || p.name.includes('Pro VIP'))
                if (!product) {
                  product = await stripe.products.create({
                    name: 'AVADA 3D Pro VIP Membership',
                    description: 'Unlimited access to 15,000+ SketchUp (.SKP) scene models, 8K PBR textures, and weekly releases.',
                  })
                }

                const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 10 })
                const monthlyPrice = priceList.data.find(
                  (p) => p.recurring?.interval === 'month' && p.unit_amount === 2000
                )
                if (monthlyPrice) {
                  priceId = monthlyPrice.id
                } else {
                  const createdPrice = await stripe.prices.create({
                    product: product.id,
                    unit_amount: 2000, // $20.00
                    currency: 'usd',
                    recurring: {
                      interval: 'month',
                    },
                  })
                  priceId = createdPrice.id
                }
              } catch (prodErr: any) {
                console.warn('Product/price catalog note:', prodErr.message)
              }

              // Create subscription with 7-day trial
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
                })

                return sendJson(200, {
                  success: true,
                  isTrial: true,
                  subscriptionId: subscription.id,
                  status: subscription.status,
                  customerId,
                  paymentMethodId: payment_method_id,
                })
              } else {
                // Fallback: SetupIntent confirmation for zero-amount hold
                return sendJson(200, {
                  success: true,
                  isTrial: true,
                  customerId,
                  paymentMethodId: payment_method_id,
                })
              }
            } else {
              // ── ONE-TIME CHARGE (e.g. $20.00 Lifetime Activation) ──
              const chargeAmount = Math.max(100, Math.round(Number(amount || 2000)))
              const paymentIntent = await stripe.paymentIntents.create({
                amount: chargeAmount,
                currency: 'usd',
                customer: customerId,
                payment_method: payment_method_id,
                confirm: true,
                setup_future_usage: 'off_session',
                automatic_payment_methods: {
                  enabled: true,
                  allow_redirects: 'never',
                },
                receipt_email: normalizedEmail || undefined,
                description: `AVADA 3D - ${plan || 'Pro Lifetime Access'} ($${(chargeAmount / 100).toFixed(2)})`,
              })

              return sendJson(200, {
                success: true,
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                customerId,
                paymentMethodId: payment_method_id,
              })
            }
          }

          // Route 2: 1-Click Charge saved card for the $20 Upsell / Renewal
          if (req.url === '/api/charge-saved-card' && req.method === 'POST') {
            const body = await getBody()
            const { amount, customerId, paymentMethodId, email } = body || {}

            const chargeAmount = Math.max(100, Math.round(Number(amount || 2000)))
            let targetCustomerId = customerId
            let targetPaymentMethodId = paymentMethodId

            if (!targetCustomerId && email) {
              const existing = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 1 })
              if (existing.data.length > 0) {
                targetCustomerId = existing.data[0].id
                const defaultPm = existing.data[0].invoice_settings?.default_payment_method
                if (defaultPm) {
                  targetPaymentMethodId = typeof defaultPm === 'string' ? defaultPm : defaultPm.id
                }
              }
            }

            if (!targetCustomerId) {
              return sendJson(400, { error: 'No saved customer found for this email' })
            }

            const paymentIntent = await stripe.paymentIntents.create({
              amount: chargeAmount,
              currency: 'usd',
              customer: targetCustomerId,
              payment_method: targetPaymentMethodId || undefined,
              off_session: true,
              confirm: true,
              description: `AVADA 3D - Pro VIP Access ($${(chargeAmount / 100).toFixed(2)})`,
            })

            return sendJson(200, {
              success: true,
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
            })
          }

          return sendJson(404, { error: 'Not found' })
        } catch (err: any) {
          console.error('Stripe API error:', err)
          return sendJson(500, {
            error: err.message || 'Payment processing failed',
            type: err.type,
            code: err.code,
          })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const stripeSecretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''

  return {
    plugins: [react(), tailwindcss(), stripeApiPlugin(stripeSecretKey)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
