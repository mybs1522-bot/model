"use client"

import { CreditCard, MapPin, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VisaLogo, MastercardLogo, AmexLogo } from "@/components/ui/card-payment-form"

export default function CheckoutForm() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4 sm:p-6 font-sans">
      <Card className="w-full max-w-md shadow-xl border border-slate-200/90 rounded-2xl bg-white text-slate-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-left pt-0">
          {/* Shipping Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-900">Delivery Address</span>
            </div>
            <p className="text-sm text-muted-foreground">742 Evergreen Terrace</p>
            <p className="text-sm text-muted-foreground">Springfield, USA</p>
          </div>

          <Separator className="bg-slate-100" />

          {/* Payment Method Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-slate-900">Billing Method</span>
              </div>
              <div className="flex items-center gap-1.5">
                <VisaLogo className="h-4.5 w-auto shadow-2xs rounded" />
                <MastercardLogo className="h-4.5 w-auto shadow-2xs rounded" />
                <AmexLogo className="h-4.5 w-auto shadow-2xs rounded" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Mastercard</p>
            <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
          </div>

          <Separator className="bg-slate-100" />

          {/* Promo Code Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-900">Apply Discount Code</span>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Enter discount code" className="flex-1 rounded-lg border-slate-200 text-sm" />
              <Button variant="secondary" className="rounded-lg px-4 font-medium text-sm">Redeem</Button>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Payment Summary */}
          <div>
            <span className="text-sm font-medium text-slate-900">Order Total</span>
            <div className="grid grid-cols-2 gap-y-2 text-sm mt-2">
              <span className="text-muted-foreground">Item Total:</span>
              <span className="text-right font-medium text-slate-900">$180.00</span>
              <span className="text-muted-foreground">Delivery Fee:</span>
              <span className="text-right font-medium text-slate-900">$15.00</span>
              <span className="text-muted-foreground">Taxes:</span>
              <span className="text-right font-medium text-slate-900">$25.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Checkout */}
      <div className="w-full max-w-md mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-white shadow-lg">
        <span className="text-lg font-bold text-slate-900">$220.00</span>
        <Button className="px-6 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-lg shadow-sm">
          Place Order
        </Button>
      </div>
    </div>
  )
}
