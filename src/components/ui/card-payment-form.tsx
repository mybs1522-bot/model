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
  onSuccess?: (savedData?: { email: string; last4: string }) => void;
}

export function CardPaymentForm({
  buttonText = "Place Order",
  sourceLocation,
  allowSavedCard = false,
  itemTotal = "$49.00",
  deliveryFee = "FREE",
  discountAmount = "-$48.00",
  totalPrice = "$1.00",
  amountInCents = 100,
  deliveryAddressLine1 = "Instant .SKP Download Link",
  deliveryAddressLine2 = "Direct SketchUp 2024 File Access",
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

  const savedEmail = localStorage.getItem("avada_user_email");
  const savedLast4 = localStorage.getItem("avada_user_last4") || "4242";
  const hasSavedCard = Boolean(allowSavedCard && savedEmail && localStorage.getItem("avada_has_saved_card") === "true");

  // Mount Official Stripe Elements + Payment Request Button (Apple Pay / Google Pay)
  useEffect(() => {
    if (hasSavedCard) return;

    let isMounted = true;
    getStripe()?.then((stripe) => {
      if (!stripe || !isMounted) return;

      // ── Payment Request Button (Apple Pay / Google Pay) ──
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

        // Check if the browser supports Apple Pay or Google Pay
        pr.canMakePayment().then((result: any) => {
          if (result && isMounted) {
            setWalletAvailable(true);

            // Mount the official Stripe Payment Request Button element
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

  const handleWalletPay = async (walletType: "apple" | "google") => {
    setErrorMessage(null);
    if (paymentRequestRef.current) {
      try {
        paymentRequestRef.current.show();
      } catch (err: any) {
        console.warn("Direct wallet show error:", err);
        setErrorMessage(
          `${walletType === "apple" ? "Apple Pay" : "Google Pay"} is not configured in this browser. Please use the card form below.`
        );
      }
    } else {
      setErrorMessage(
        `${walletType === "apple" ? "Apple Pay" : "Google Pay"} is initializing. Please enter card details below.`
      );
    }
  };

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
            amount: amountInCents,
            email: targetEmail.trim().toLowerCase(),
            payment_method_id: paymentMethod.id,
            plan: sourceLocation,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Payment was declined by your card issuer. Please try another card.");
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

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
      {/* ══════ MAIN ORDER SUMMARY CARD ══════ */}
      <Card className="w-full max-w-md shadow-xl border border-slate-200/90 rounded-2xl bg-white text-slate-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">Order Summary</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-5 text-left pt-0">
          {/* Digital Delivery / Order Details Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-900">Order Details</span>
            </div>
            <p className="text-sm text-muted-foreground">{deliveryAddressLine1}</p>
            <p className="text-sm text-muted-foreground">{deliveryAddressLine2}</p>
          </div>

          <Separator className="bg-slate-100" />

          {/* Payment Method / Card Entry Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-slate-900">Payment Method</span>
              </div>
              {/* REAL PAYMENT LOGOS */}
              <div className="flex items-center gap-1.5">
                <VisaLogo className="h-4.5 w-auto rounded shadow-2xs" />
                <MastercardLogo className="h-4.5 w-auto rounded shadow-2xs" />
                <AmexLogo className="h-4.5 w-auto rounded shadow-2xs" />
                <ApplePayLogo className="h-4.5 w-auto rounded shadow-2xs" />
                <GooglePayLogo className="h-4.5 w-auto rounded shadow-2xs" />
              </div>
            </div>

            {hasSavedCard ? (
              /* 1-Click Saved Card View */
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between font-mono text-slate-900">
                  <span className="font-bold flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-emerald-600" /> Card on File
                  </span>
                  <span className="font-bold text-emerald-700">•••• •••• •••• {savedLast4}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">1-Click charge to <span className="font-mono font-bold text-slate-800">{savedEmail}</span></p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* ── Native Stripe Payment Request Element Container (when supported by browser) ── */}
                <div ref={paymentRequestButtonRef} id="payment-request-button" className={walletAvailable ? "w-full min-h-[44px]" : "hidden"} />

                {/* ── Direct 1-Click Express Checkout Buttons ── */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleWalletPay("apple")}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-sm font-semibold transition active:scale-[0.98] shadow-sm cursor-pointer border border-black"
                  >
                    <ApplePayLogo className="h-5 w-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWalletPay("google")}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold border border-slate-300 transition active:scale-[0.98] shadow-2xs cursor-pointer"
                  >
                    <GooglePayLogo className="h-5 w-auto" />
                  </button>
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">or pay with card</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

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
              <span className="text-sm font-medium text-slate-900">Order Total</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                One-Time Payment • No Subscription
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm mt-2.5">
              <span className="text-muted-foreground">Item Total:</span>
              <span className="text-right font-medium text-slate-900">{itemTotal}</span>
              
              <span className="text-muted-foreground">Delivery Fee:</span>
              <span className="text-right font-medium text-slate-900">{deliveryFee}</span>
              
              {promoApplied && (
                <>
                  <span className="text-muted-foreground">Discount Applied:</span>
                  <span className="text-right font-medium text-emerald-600">{discountAmount}</span>
                </>
              )}
            </div>
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
          <span className="text-[10px] text-muted-foreground font-medium">One-time payment</span>
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-6 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Securing Payment...
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
            <Check className="size-3.5 text-emerald-600" /> Instant .ZIP Delivery
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Check className="size-3.5 text-emerald-600" /> 30-Day Guarantee
          </span>
        </div>
        <p className="text-[10px] text-slate-400">Strictly 1-time charge. Powered by Stripe.</p>
      </div>
    </form>
  );
}
