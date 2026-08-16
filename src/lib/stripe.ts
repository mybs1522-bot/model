import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { saveLeadEmail } from "./supabase";

const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "pk_live_51PRJCsGGsoQTkhyv6OrT4zvnaaB5Y0MSSkTXi0ytj33oygsfW3dcu6aOFa9q3dr2mXYTCJErnFQJcOcyuDAsQd4B00lIAdclbB";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

export interface CardDetails {
  email: string;
  cardNumber: string;
  expiry: string; // "MM/YY"
  cvc: string;
  amount?: number; // in cents, e.g. 100 for $1.00, 2900 for $29.00
  plan?: string;
}

/**
 * Charge a credit card directly on-page using Stripe Elements / API
 */
export async function processOnPageCardPayment(details: CardDetails) {
  const { email, cardNumber, expiry, cvc, amount = 100, plan = "starter_1" } = details;

  // 1. Parse expiry
  const cleanExpiry = expiry.replace(/\s/g, "");
  const [expMonthStr, expYearStr] = cleanExpiry.includes("/")
    ? cleanExpiry.split("/")
    : [cleanExpiry.slice(0, 2), cleanExpiry.slice(2)];

  const exp_month = parseInt(expMonthStr, 10);
  let exp_year = parseInt(expYearStr, 10);
  if (exp_year < 100) {
    exp_year += 2000;
  }

  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const last4 = cleanCardNumber.slice(-4) || "4242";

  // 2. Initialize Stripe
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe SDK failed to initialize. Please check your publishable key.");
  }

  // 3. Create Stripe PaymentMethod securely
  const { paymentMethod, error: pmError } = await (stripe as any).createPaymentMethod({
    type: "card",
    card: {
      number: cleanCardNumber,
      exp_month,
      exp_year,
      cvc: cvc.trim(),
    },
    billing_details: {
      email: email.trim().toLowerCase(),
    },
  });

  if (pmError || !paymentMethod) {
    throw new Error(pmError?.message || "Invalid card details. Please check your card number, expiry, and CVC.");
  }

  // 4. Send PaymentMethod to our backend to create and confirm the PaymentIntent
  const response = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      email: email.trim().toLowerCase(),
      payment_method_id: paymentMethod.id,
      plan,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Payment was declined by Stripe. Please try a different card.");
  }

  // 5. Save customer & card session in localStorage for seamless 1-click upsells
  localStorage.setItem("avada_user_email", email.trim().toLowerCase());
  localStorage.setItem("avada_user_last4", last4);
  localStorage.setItem("avada_has_saved_card", "true");
  if (data.customerId) {
    localStorage.setItem("avada_stripe_customer_id", data.customerId);
  }
  if (data.paymentMethodId) {
    localStorage.setItem("avada_stripe_payment_method_id", data.paymentMethodId);
  }

  // 6. Record lead in Supabase (non-blocking)
  try {
    await saveLeadEmail(email, plan);
  } catch (err) {
    console.warn("Supabase lead log note:", err);
  }

  return {
    success: true,
    paymentIntentId: data.paymentIntentId,
    customerId: data.customerId,
    last4,
  };
}

/**
 * 1-Click Charge saved card for the $29 Upsell without asking for card details again
 */
export async function chargeSavedCardUpsell(amount: number = 2900) {
  const email = localStorage.getItem("avada_user_email") || "";
  const customerId = localStorage.getItem("avada_stripe_customer_id") || "";
  const paymentMethodId = localStorage.getItem("avada_stripe_payment_method_id") || "";

  if (!email && !customerId) {
    throw new Error("No existing card on file found. Please enter your card details.");
  }

  const response = await fetch("/api/charge-saved-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      email,
      customerId,
      paymentMethodId,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to charge saved card. Please enter your card again.");
  }

  // Record upsell purchase in Supabase (non-blocking)
  try {
    await saveLeadEmail(email, "upsell_lifetime_29");
  } catch (err) {
    console.warn("Supabase lead log note:", err);
  }

  return {
    success: true,
    paymentIntentId: data.paymentIntentId,
  };
}

/**
 * General fallback handler
 */
export async function handleStripePayment(email: string, plan: string = "lifetime_29") {
  if (plan.includes("upsell") || plan.includes("lifetime")) {
    return chargeSavedCardUpsell(2900);
  }
  try {
    await saveLeadEmail(email, plan);
  } catch (e) {}
  return { success: true };
}
