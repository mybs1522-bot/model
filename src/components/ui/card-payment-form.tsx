"use client";

import { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Lock,
  MapPin,
  Tag,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import { getStripe, chargeSavedCardUpsell } from "@/lib/stripe";
import { saveLeadEmail } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Official Real Visa SVG Logo
export function VisaLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1"/>
      <path d="M15.8 16.5H13.6L15 7.5H17.2L15.8 16.5ZM22.5 7.7C22 7.5 21.2 7.3 20.2 7.3C17.9 7.3 16.3 8.5 16.3 10.2C16.3 11.5 17.5 12.2 18.4 12.6C19.3 13 19.6 13.3 19.6 13.7C19.6 14.3 18.9 14.6 18.2 14.6C17.2 14.6 16.6 14.4 15.9 14.1L15.6 13.9L15.3 15.8C15.9 16.1 17 16.4 18.1 16.4C20.5 16.4 22.1 15.2 22.1 13.4C22.1 12.3 21.4 11.4 19.9 10.7C19 10.3 18.5 10 18.5 9.5C18.5 9 19.1 8.6 20.1 8.6C21 8.6 21.6 8.8 22.1 9L22.3 9.1L22.5 7.7ZM28.4 7.5H26.7C26.2 7.5 25.8 7.6 25.6 8.1L22 16.5H24.3L24.8 15.1H27.6L27.9 16.5H30L28.4 7.5ZM25.4 13.4L26.5 10.4C26.5 10.4 26.8 9.6 26.9 9.3H27C27.1 9.6 27.2 10.2 27.3 10.4L27.9 13.4H25.4ZM12.4 7.5L10.2 13.6L9.9 12.1C9.4 10.4 7.9 8.6 6.2 7.7L8.2 16.5H10.6L14.3 7.5H12.4Z" fill="#1434CB"/>
      <path d="M8.3 7.5H4.7L4.6 7.7C7.4 8.4 9.6 10.4 10.4 12.5L9.6 8.3C9.4 7.7 8.9 7.5 8.3 7.5Z" fill="#F7B600"/>
    </svg>
  );
}

// Official Real Mastercard SVG Logo
export function MastercardLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1"/>
      <circle cx="15" cy="12" r="6.5" fill="#EB001B"/>
      <circle cx="23" cy="12" r="6.5" fill="#F79E1B"/>
      <path d="M19 7.3A6.47 6.47 0 0 0 16.5 12c0 1.9.9 3.7 2.5 4.7A6.47 6.47 0 0 0 21.5 12c0-1.9-.9-3.7-2.5-4.7Z" fill="#FF5F00"/>
    </svg>
  );
}

// Official Real American Express (Amex) SVG Logo
export function AmexLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#006FCF"/>
      <path d="M7 16L8.8 12L10.6 16H12.5L9.8 10L12.5 4H10.6L8.8 8L7 4H5L7.8 10L5 16H7ZM13.5 4V16H19.5V14H15.5V11H19V9H15.5V6H19.5V4H13.5ZM21 4V16H23V7.5L25.5 14H26.5L29 7.5V16H31V4H28.5L26 11.5L23.5 4H21Z" fill="#FFFFFF"/>
    </svg>
  );
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
  const elementsRef = useRef<any>(null);
  const cardNumberElementRef = useRef<any>(null);

  const savedEmail = localStorage.getItem("avada_user_email");
  const savedLast4 = localStorage.getItem("avada_user_last4") || "4242";
  const hasSavedCard = Boolean(allowSavedCard && savedEmail && localStorage.getItem("avada_has_saved_card") === "true");

  // Mount Official Stripe Elements
  useEffect(() => {
    if (hasSavedCard) return;

    let isMounted = true;
    getStripe()?.then((stripe) => {
      if (!stripe || !isMounted) return;

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
          {/* Shipping / Digital Delivery Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-900">Delivery Address</span>
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
                <span className="text-sm font-medium text-slate-900">Billing Method</span>
              </div>
              {/* REAL OFFICIAL VISA, MASTERCARD & AMEX LOGOS */}
              <div className="flex items-center gap-1.5">
                <VisaLogo className="h-4.5 w-auto shadow-2xs rounded" />
                <MastercardLogo className="h-4.5 w-auto shadow-2xs rounded" />
                <AmexLogo className="h-4.5 w-auto shadow-2xs rounded" />
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
              /* Official Stripe Elements Containers */
              <div className="space-y-2.5">
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
            <span className="text-sm font-medium text-slate-900">Order Total</span>
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
        <span className="text-lg font-bold text-slate-900">{totalPrice}</span>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-6 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Securing Payment...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {/* SSL Encryption Indicator */}
      <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-[11px] font-medium pt-3">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        <span>256-Bit SSL Encrypted • Powered by Stripe</span>
      </div>
    </form>
  );
}
