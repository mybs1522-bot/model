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
          // Route 1: Create subscription with 7-day trial ($20/mo or $180/yr) or charge payment intent
          if (req.url === '/api/create-payment-intent' && req.method === 'POST') {
            const body = await getBody()
            const { amount, email, payment_method_id, plan, is_trial, plan_cycle } = body || {}

            if (!payment_method_id) {
              return sendJson(400, { error: 'Missing required parameter: payment_method_id' })
            }

            const isTrialFlow = Boolean(is_trial === true || amount === 0 || (typeof plan === 'string' && plan.includes('trial')))
            const normalizedEmail = email ? email.trim().toLowerCase() : ''
            const isYearly = Boolean(
              plan_cycle === 'yearly' ||
              (typeof plan === 'string' && (plan.includes('yearly') || plan.includes('180')))
            )
            const targetUnitAmount = isYearly ? 18000 : 2000 // $180.00 or $20.00
            const targetInterval = isYearly ? 'year' : 'month'
            const planDesc = isYearly
              ? 'AVADA 3D Pro VIP - 7-Day Free Trial ($180/year after that • 25% OFF)'
              : 'AVADA 3D Pro VIP - 7-Day Free Trial ($20/month after that)'

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
              // ── CARD FUND & ACTIVE STATUS VERIFICATION ($1.00 Pre-Auth Hold & Immediate Void) ──
              // Forces the issuing bank to verify real available balance. Burner/$0 cards get rejected instantly!
              let verifyIntent: any = null
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
                })

                // Immediately cancel/release the $1 hold so the user pays $0.00 today
                if (verifyIntent && verifyIntent.id) {
                  await stripe.paymentIntents.cancel(verifyIntent.id).catch((cErr: any) => {
                    console.warn('Pre-auth release note:', cErr.message)
                  })
                }
              } catch (verifyErr: any) {
                console.error('Card verification decline:', verifyErr.message)
                return sendJson(400, {
                  error: 'Card Authorization Failed! Use a different card.',
                  code: verifyErr.code,
                  decline_code: verifyErr.decline_code,
                })
              }

              // ── 7-DAY FREE TRIAL SUBSCRIPTION ($20/MO OR $180/YR) ──
              // Use verified Stripe Price IDs directly with dynamic fallback
              const MONTHLY_PRICE_ID = 'price_1U6zDTGGsoQTkhyvOU4AS6u0' // $20.00 / month
              const YEARLY_PRICE_ID = 'price_1U70HFGGsoQTkhyvN9A2wPkv'  // $180.00 / year (25% OFF)
              let priceId = isYearly ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID

              try {
                // Verify or fallback dynamically if needed
                if (!priceId) {
                  const productList = await stripe.products.list({ active: true, limit: 20 })
                  let product = productList.data.find((p) => p.name.includes('AVADA 3D') || p.name.includes('Pro VIP'))
                  if (!product) {
                    product = await stripe.products.create({
                      name: 'AVADA 3D Pro VIP Membership',
                      description: 'Unlimited access to 15,000+ SketchUp (.SKP) scene models, 8K PBR textures, and weekly releases.',
                    })
                  }

                  const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 10 })
                  const matchedPrice = priceList.data.find(
                    (p) => p.recurring?.interval === targetInterval && p.unit_amount === targetUnitAmount
                  )
                  if (matchedPrice) {
                    priceId = matchedPrice.id
                  } else {
                    const createdPrice = await stripe.prices.create({
                      product: product.id,
                      unit_amount: targetUnitAmount,
                      currency: 'usd',
                      recurring: {
                        interval: targetInterval,
                      },
                    })
                    priceId = createdPrice.id
                  }
                }
              } catch (prodErr: any) {
                console.warn('Product/price catalog note:', prodErr.message)
              }

              // Create subscription with 7-day trial
              let subscription: any = null
              if (priceId) {
                subscription = await stripe.subscriptions.create({
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
                })
              }

              const clientSecret =
                subscription?.pending_setup_intent?.client_secret ||
                subscription?.latest_invoice?.payment_intent?.client_secret ||
                null

              return sendJson(200, {
                success: true,
                isTrial: true,
                subscriptionId: subscription?.id || null,
                status: subscription?.status || 'trialing',
                clientSecret,
                customerId,
                paymentMethodId: payment_method_id,
              })
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

            if (!targetPaymentMethodId && targetCustomerId) {
              try {
                const pms = await stripe.paymentMethods.list({ customer: targetCustomerId, type: 'card', limit: 1 })
                if (pms.data.length > 0) {
                  targetPaymentMethodId = pms.data[0].id
                }
              } catch (pmErr: any) {
                console.warn('Payment method lookup note:', pmErr.message)
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
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react'
              }
              if (id.includes('@stripe')) {
                return 'vendor-stripe'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons'
              }
            }
          },
        },
      },
    },
  }
})
