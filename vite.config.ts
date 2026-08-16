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
          // Route 1: Create and charge initial payment intent ($1.00 starter pack or on-page card)
          if (req.url === '/api/create-payment-intent' && req.method === 'POST') {
            const body = await getBody()
            const { amount, email, payment_method_id, plan } = body

            if (!amount || !payment_method_id) {
              return sendJson(400, { error: 'Missing required parameters (amount, payment_method_id)' })
            }

            // 1. Find or create Stripe customer
            let customerId = ''
            if (email) {
              const existing = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 1 })
              if (existing.data.length > 0) {
                customerId = existing.data[0].id
              } else {
                const created = await stripe.customers.create({
                  email: email.trim().toLowerCase(),
                  description: `AVADA 3D Customer (${email})`,
                })
                customerId = created.id
              }

              // Attach payment method to customer for 1-click future upsell
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
              receipt_email: email || undefined,
              description: `AVADA 3D - ${plan || '20 Models Starter Pack'} ($${(amount / 100).toFixed(2)})`,
            })

            return sendJson(200, {
              success: true,
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
              customerId,
              paymentMethodId: payment_method_id,
            })
          }

          // Route 2: 1-Click Charge saved card for the $29 Upsell
          if (req.url === '/api/charge-saved-card' && req.method === 'POST') {
            const body = await getBody()
            const { amount, customerId, paymentMethodId, email } = body

            if (!amount) {
              return sendJson(400, { error: 'Missing amount parameter' })
            }

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
              amount: Math.round(Number(amount)),
              currency: 'usd',
              customer: targetCustomerId,
              payment_method: targetPaymentMethodId || undefined,
              off_session: true,
              confirm: true,
              description: 'AVADA 3D - 3,000+ Models VIP Lifetime Upsell ($29.00)',
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
