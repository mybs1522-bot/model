"use client";

import { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Lock,
  Package,
  Tag,
  ShieldCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import { getStripe, chargeSavedCardUpsell } from "@/lib/stripe";
import { saveLeadEmail } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Real brand logos — sourced from aaronfagan/svg-credit-card-payment-icons & payrexx/payment-logos
import visaSvg from "@/assets/card-logos/visa.svg";
import mastercardSvg from "@/assets/card-logos/mastercard.svg";
import amexSvg from "@/assets/card-logos/amex.svg";
import applepaySvg from "@/assets/card-logos/applepay.svg";
import googlepaySvg from "@/assets/card-logos/googlepay.svg";

export function VisaLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return <img src={visaSvg} alt="Visa" className={className} />;
}

export function MastercardLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return <img src={mastercardSvg} alt="Mastercard" className={className} />;
}

export function AmexLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return <img src={amexSvg} alt="American Express" className={className} />;
}

export function ApplePayLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return <img src={applepaySvg} alt="Apple Pay" className={className} />;
}

export function GooglePayLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return <img src={googlepaySvg} alt="Google Pay" className={className} />;
}

interface CardPaymentFormProps {
  buttonText?: string;
  sourceLocation: string;
  allowSavedCard?: boolean;
  itemTotal?: string;
  deliveryFee?: string;
  discountAmount?: string;
  totalPrice?: string;
  amountInCents?: number; // 100 for $1, 2900 for $29
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  isTrial?: boolean;
  hideOrderDetails?: boolean;
  onSuccess?: (savedData?: { email: string; last4: string }) => void;
}

export function CardPaymentForm({
  buttonText = "Start 7-Day Free Trial ($0.00)",
  sourceLocation,
  allowSavedCard = false,
  itemTotal = "$29.00",
  deliveryFee = "FREE",
  discountAmount = "-$29.00",
  totalPrice = "$0.00",
  amountInCents = 0,
  deliveryAddressLine1 = "7-Day Free Trial — All 3,000+ Models",
  deliveryAddressLine2 = "Instant SketchUp .SKP & 8K Textures Access",
  isTrial = true,
  hideOrderDetails = false,
  onSuccess,
}: CardPaymentFormProps) {
  const [email, setEmail] = useState(() => (allowSavedCard ? (localStorage.getItem("avada_user_email") || "") : ""));
  const [promoInput, setPromoInput] = useState("STARTER98");
  const [promoApplied, setPromoApplied] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardExpiryRef = useRef<HTMLDivElement>(null);
  const cardCvcRef = useRef<HTMLDivElement>(null);
  const paymentRequestButtonRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<any>(null);
  const cardNumberElementRef = useRef<any>(null);
  const paymentRequestRef = useRef<any>(null);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [walletType, setWalletType] = useState<{ applePay: boolean; googlePay: boolean }>({ applePay: false, googlePay: false });
  const [useNewCard, setUseNewCard] = useState(false);

  const savedEmail = localStorage.getItem("avada_user_email");
  const savedLast4 = localStorage.getItem("avada_user_last4") || "4242";
  const hasSavedCard = Boolean(allowSavedCard && !useNewCard && savedEmail && localStorage.getItem("avada_has_saved_card") === "true");

  // Mount Official Stripe Elements + Payment Request Button (Apple Pay / Google Pay)
  useEffect(() => {
    if (hasSavedCard) return;

    let isMounted = true;
    getStripe()?.then((stripe) => {
      if (!stripe || !isMounted) return;

      // ── Payment Request Button (Apple Pay / Google Pay) ──
      // Per Stripe docs: use canMakePayment() to check browser/device wallet support.
      // Only mount the native Stripe Payment Request Button when supported.
      // The button auto-renders the correct wallet (Apple Pay on Safari, Google Pay on Chrome, etc.)
      if (!paymentRequestRef.current) {
        const pr = stripe.paymentRequest({
          country: "US",
          currency: "usd",
          total: {
            label: sourceLocation === "upsell_lifetime" ? "VIP Lifetime Pass" : "SketchUp Starter Pack",
            amount: amountInCents,
          },
          requestPayerEmail: true,
          requestPayerName: true,
        });

        paymentRequestRef.current = pr;

        // Check if the browser/device supports Apple Pay or Google Pay
        // canMakePayment() returns null if no wallet is available, or an object like
        // { applePay: true } or { googlePay: true } indicating which wallet is ready.
        pr.canMakePayment().then((result: any) => {
          if (result && isMounted) {
            setWalletAvailable(true);
            setWalletType({
              applePay: Boolean(result.applePay),
              googlePay: Boolean(result.googlePay),
            });

            // Mount the official Stripe Payment Request Button element
            // Stripe auto-renders the correct button (Apple Pay / Google Pay / Link)
            // based on the user's browser and saved payment methods.
            if (paymentRequestButtonRef.current) {
              const prButton = (elementsRef.current || stripe.elements()).create("paymentRequestButton", {
                paymentRequest: pr,
                style: {
                  paymentRequestButton: {
                    type: "default",
                    theme: "dark",
                    height: "44px",
                  },
                },
              });
              prButton.mount(paymentRequestButtonRef.current);
            }
          }
        });

        // Handle the paymentmethod event — process the payment
        pr.on("paymentmethod", async (ev: any) => {
          try {
            const payerEmail = ev.payerEmail || email || "customer@wallet.pay";

            const response = await fetch("/api/create-payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: amountInCents,
                email: payerEmail.trim().toLowerCase(),
                payment_method_id: ev.paymentMethod.id,
                plan: sourceLocation,
              }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
              ev.complete("fail");
              setErrorMessage(data.error || "Payment failed. Please try again.");
              return;
            }

            ev.complete("success");

            const last4 = ev.paymentMethod.card?.last4 || "0000";

            // Save session for 1-click upsell
            localStorage.setItem("avada_user_email", payerEmail.trim().toLowerCase());
            localStorage.setItem("avada_user_last4", last4);
            localStorage.setItem("avada_has_saved_card", "true");
            if (data.customerId) localStorage.setItem("avada_stripe_customer_id", data.customerId);
            if (data.paymentMethodId) localStorage.setItem("avada_stripe_payment_method_id", data.paymentMethodId);

            try { await saveLeadEmail(payerEmail, sourceLocation); } catch (_e) {}

            if (onSuccess) onSuccess({ email: payerEmail, last4 });
          } catch (err: any) {
            ev.complete("fail");
            setErrorMessage(err.message || "Wallet payment failed.");
          }
        });
      }

      // ── Standard Card Elements ──
      if (!elementsRef.current) {
        elementsRef.current = stripe.elements();

        const elementStyle = {
          style: {
            base: {
              fontSize: "14px",
              color: "#0f172a",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              "::placeholder": {
                color: "#94a3b8",
              },
            },
            invalid: {
              color: "#ef4444",
            },
          },
        };

        const cardNumber = elementsRef.current.create("cardNumber", elementStyle);
        const cardExpiry = elementsRef.current.create("cardExpiry", elementStyle);
        const cardCvc = elementsRef.current.create("cardCvc", elementStyle);

        if (cardNumberRef.current) cardNumber.mount(cardNumberRef.current);
        if (cardExpiryRef.current) cardExpiry.mount(cardExpiryRef.current);
        if (cardCvcRef.current) cardCvc.mount(cardCvcRef.current);

        cardNumberElementRef.current = cardNumber;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hasSavedCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetEmail = hasSavedCard ? (savedEmail || email) : email;
    if (!targetEmail) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsProcessing(true);
    try {
      if (hasSavedCard) {
        // 1-Click off-session Stripe charge for saved card
        await chargeSavedCardUpsell(amountInCents);
        if (onSuccess) onSuccess({ email: targetEmail, last4: savedLast4 });
      } else {
        const stripe = await getStripe();
        if (!stripe || !cardNumberElementRef.current) {
          throw new Error("Stripe Elements is initializing. Please wait a moment and try again.");
        }

        // 1. Create PaymentMethod securely with official Stripe Elements
        const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
          type: "card",
          card: cardNumberElementRef.current,
          billing_details: {
            email: targetEmail.trim().toLowerCase(),
          },
        });

        if (pmError || !paymentMethod) {
          throw new Error(pmError?.message || "Invalid card details. Please check your card number, expiry, and CVC.");
        }

        // 2. Send PaymentMethod to backend to create and confirm the PaymentIntent
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: isTrial ? 0 : amountInCents,
            is_trial: isTrial,
            email: targetEmail.trim().toLowerCase(),
            payment_method_id: paymentMethod.id,
            plan: sourceLocation,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Card verification failed. Please check that your card has funds and try again.");
        }

        const last4 = paymentMethod.card?.last4 || "4242";

        // Save session in localStorage for seamless 1-click upsell
        localStorage.setItem("avada_user_email", targetEmail.trim().toLowerCase());
        localStorage.setItem("avada_user_last4", last4);
        localStorage.setItem("avada_has_saved_card", "true");
        if (data.customerId) {
          localStorage.setItem("avada_stripe_customer_id", data.customerId);
        }
        if (data.paymentMethodId) {
          localStorage.setItem("avada_stripe_payment_method_id", data.paymentMethodId);
        }

        // Record lead in Supabase (non-blocking)
        try {
          await saveLeadEmail(targetEmail, sourceLocation);
        } catch (err) {}

        if (onSuccess) {
          onSuccess({ email: targetEmail, last4 });
        }
      }
    } catch (err: any) {
      console.error("Payment processing error:", err);
      setErrorMessage(err.message || "Payment declined. Please check your card details and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (hideOrderDetails) {
    return (
      <form onSubmit={handleSubmit} className="w-full text-left space-y-3.5 pt-1">
        {/* Payment Method / Card Entry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Payment & Access Email</span>
            </div>
            {/* Payment Method Logos */}
            <div className="flex items-center gap-1.5">
              <VisaLogo className="h-4 w-auto rounded shadow-2xs" />
              <MastercardLogo className="h-4 w-auto rounded shadow-2xs" />
              <AmexLogo className="h-4 w-auto rounded shadow-2xs" />
              {walletType.applePay && <ApplePayLogo className="h-4 w-auto rounded shadow-2xs" />}
              {walletType.googlePay && <GooglePayLogo className="h-4 w-auto rounded shadow-2xs" />}
            </div>
          </div>

          {hasSavedCard ? (
            /* 1-Click Saved Card View */
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between font-mono text-slate-900">
                <span className="font-bold flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-emerald-600" /> Card on File
                </span>
                <span className="font-bold text-emerald-700">•••• •••• •••• {savedLast4}</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">1-Click verification for <span className="font-mono font-bold text-slate-800">{savedEmail}</span></p>
              <div className="pt-1 border-t border-emerald-200/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("avada_has_saved_card");
                    localStorage.removeItem("avada_user_last4");
                    setUseNewCard(true);
                  }}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                >
                  Enter a different / new card →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Native Apple Pay / Google Pay Button */}
              <div ref={paymentRequestButtonRef} id="payment-request-button" className={walletAvailable ? "w-full min-h-[44px]" : "hidden"} />

              {walletAvailable && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">or pay with card</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  required
                  placeholder="Enter your email for access"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition shadow-2xs"
                />
              </div>

              {/* Stripe Card Number Element */}
              <div className="relative">
                <div
                  ref={cardNumberRef}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 transition shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 min-h-[40px]"
                />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Expiry & CVC Stripe Elements */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  ref={cardExpiryRef}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 transition shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 min-h-[40px]"
                />
                <div className="relative">
                  <div
                    ref={cardCvcRef}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 transition shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 min-h-[40px]"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Total & Card Fund Verification Disclaimer */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-700">Total Due Today:</span>
            <span className="text-emerald-700 font-mono text-sm">{totalPrice} <span className="text-[10px] text-slate-500 font-normal">($0 for 7 days)</span></span>
          </div>
          {isTrial && (
            <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
              ℹ️ Temporary $1 bank pre-auth check is reversed immediately. <strong>$0.00 charged today</strong>. Cancel anytime in 1 click.
            </p>
          )}
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* High Conversion CTA Action Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm sm:text-base shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-400"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Verifying Card...
            </span>
          ) : (
            <>
              <Lock className="size-4" />
              <span>{buttonText}</span>
            </>
          )}
        </button>

        {/* Compact Trust Indicators */}
        <div className="text-center pt-1 space-y-1">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted • Powered by Stripe</span>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
      {/* ══════ MAIN ORDER SUMMARY CARD ══════ */}
      <Card className="w-full max-w-md shadow-xl border border-slate-200/90 rounded-2xl bg-white text-slate-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">Order Summary</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-5 text-left pt-0">
          {/* Digital Delivery / Order Details Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-900">Order Details</span>
            </div>
            
            {/* Main Product */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 size-10 rounded border border-slate-200 flex items-center justify-center shrink-0">
                <Package className="size-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 leading-snug">{deliveryAddressLine1}</p>
                <p className="text-xs text-slate-500">Digital Access • 3,000+ Models</p>
              </div>
              <span className="text-sm font-medium text-slate-900">{totalPrice}</span>
            </div>

            {/* Free Addon */}
            {deliveryAddressLine2 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-bl-lg">
                  Free Addon
                </div>
                <div className="bg-white size-10 rounded-lg border border-emerald-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <img src="/sketchup-logo.png" alt="SketchUp Logo" className="w-6 h-6 object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 leading-snug">Free SketchUp Course</p>
                  <p className="text-xs text-emerald-700 font-semibold">Lifetime Access</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 line-through opacity-70 mr-1">$49</span>
                <span className="text-sm font-black text-emerald-600">FREE</span>
              </div>
            )}
          </div>

          <Separator className="bg-slate-100" />

          {/* Payment Method / Card Entry Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-slate-900">Payment Method</span>
              </div>
              {/* Only show logos for payment methods that are actually available */}
              <div className="flex items-center gap-1.5">
                <VisaLogo className="h-4.5 w-auto rounded shadow-2xs" />
                <MastercardLogo className="h-4.5 w-auto rounded shadow-2xs" />
                <AmexLogo className="h-4.5 w-auto rounded shadow-2xs" />
                {walletType.applePay && <ApplePayLogo className="h-4.5 w-auto rounded shadow-2xs" />}
                {walletType.googlePay && <GooglePayLogo className="h-4.5 w-auto rounded shadow-2xs" />}
              </div>
            </div>

            {hasSavedCard ? (
              /* 1-Click Saved Card View */
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between font-mono text-slate-900">
                  <span className="font-bold flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-emerald-600" /> Card on File
                  </span>
                  <span className="font-bold text-emerald-700">•••• •••• •••• {savedLast4}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">1-Click verification for <span className="font-mono font-bold text-slate-800">{savedEmail}</span></p>
                <div className="pt-1.5 border-t border-emerald-200/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("avada_has_saved_card");
                      localStorage.removeItem("avada_user_last4");
                      setUseNewCard(true);
                    }}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                  >
                    Enter a different / new card →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* ── Native Stripe Payment Request Button (Apple Pay / Google Pay) ──
                     This div is ONLY shown when canMakePayment() confirms a wallet is available.
                     Stripe renders the correct button automatically based on the user's browser/device.
                     On Safari with Apple Pay configured → shows Apple Pay button
                     On Chrome with Google Pay configured → shows Google Pay button
                     If no wallet is available → this div stays hidden, card form shows directly */}
                <div ref={paymentRequestButtonRef} id="payment-request-button" className={walletAvailable ? "w-full min-h-[44px]" : "hidden"} />

                {/* ── Divider (only shown when wallet buttons are available) ── */}
                {walletAvailable && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">or pay with card</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}

                {/* ── Card Entry ── */}
                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition shadow-2xs"
                  />
                </div>

                {/* Stripe Card Number Element Mounted Here */}
                <div className="relative">
                  <div
                    ref={cardNumberRef}
                    className="w-full pl-9 pr-3.5 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 transition shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 min-h-[42px]"
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Expiry & CVC Stripe Elements Mounted Here */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    ref={cardExpiryRef}
                    className="w-full px-3.5 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 transition shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 min-h-[42px]"
                  />
                  <div className="relative">
                    <div
                      ref={cardCvcRef}
                      className="w-full pl-3.5 pr-8 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 transition shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 min-h-[42px]"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-slate-100" />

          {/* Promo Code Section */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-900">Apply Discount Code</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter discount code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setPromoApplied(true)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium border border-slate-200 transition cursor-pointer"
              >
                {promoApplied ? "Applied ✓" : "Redeem"}
              </button>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Payment / Order Total Summary */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Total Due Today</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isTrial ? "7-Day Free Trial • Cancel Anytime" : "One-Time Payment • No Subscription"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm mt-2.5">
              <span className="text-muted-foreground">Plan Value:</span>
              <span className="text-right font-medium text-slate-900">{itemTotal}</span>
              
              <span className="text-muted-foreground">Digital Delivery:</span>
              <span className="text-right font-medium text-slate-900">{deliveryFee}</span>

              <span className="text-muted-foreground">Free Trial Discount:</span>
              <span className="text-right font-medium text-emerald-600">{discountAmount}</span>

              <span className="text-muted-foreground font-bold">Due Today:</span>
              <span className="text-right font-bold text-slate-900">{totalPrice}</span>
            </div>

            {isTrial && (
              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                ℹ️ <strong>Card Fund Verification:</strong> A temporary $1.00 authorization check is used to verify active card validity and reversed immediately. You are charged <strong>$0.00 today</strong>.
              </div>
            )}
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════ DETACHED FOOTER CHECKOUT BAR ══════ */}
      <div className="w-full max-w-md mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-white shadow-lg">
        <div className="text-left">
          <div className="text-lg font-black text-slate-900 leading-none">{totalPrice}</div>
          <span className="text-[10px] text-emerald-700 font-bold">{isTrial ? "7 Days Free • Cancel Anytime" : "One-time payment"}</span>
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-6 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying Card...
            </span>
          ) : (
            <>
              <Lock className="size-3.5" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </div>

      {/* SSL Encryption & Guarantee Indicator */}
      <div className="space-y-1.5 pt-3 text-center">
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-[11px] font-medium flex-wrap">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Check className="size-3.5 text-emerald-600" /> Instant Vault Access
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Check className="size-3.5 text-emerald-600" /> Cancel Anytime
          </span>
        </div>
        <p className="text-[10px] text-slate-400">Powered by Stripe • Zero Risk 7-Day Trial</p>
      </div>
    </form>
  );
}


