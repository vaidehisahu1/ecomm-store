"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { DeliveryMethod } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, CreditCard, Loader2, Lock, MapPin, Package, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { syncCart } from "@/actions/cart";
import { cancelPendingOrder, placeOrder } from "@/actions/checkout";
import { OrderTotals } from "@/components/cart/order-totals";
import { PromoCodeInput } from "@/components/cart/promo-code-input";
import { AddressFields, emptyAddress, type AddressDraft } from "@/components/checkout/address-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { cartSubtotal, useCart } from "@/lib/cart-store";
import { computeTotals, deliveryOptions, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";
import { addressSchema, cardSchema, fieldErrors } from "@/lib/validators";

type SavedAddress = AddressDraft & { id: string; isDefault: boolean };
type Card = { cardName: string; cardNumber: string; expiry: string; cvc: string };

const steps = [
  { key: "shipping", label: "Shipping", icon: MapPin },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "review", label: "Review", icon: Package },
] as const;

const formatCardNumber = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function CheckoutFlow({
  email,
  addresses,
  paymentMode,
}: {
  email: string;
  addresses: SavedAddress[];
  paymentMode: "stripe" | "mock" | "disabled";
}) {
  const stripeEnabled = paymentMode === "stripe";
  const router = useRouter();
  const searchParams = useSearchParams();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const replace = useCart((s) => s.replace);
  const [hydrated, setHydrated] = useState(false);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string>(defaultAddress?.id ?? "new");
  const [draft, setDraft] = useState<AddressDraft>({ ...emptyAddress });
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [method, setMethod] = useState<DeliveryMethod>("STANDARD");
  const [card, setCard] = useState<Card>({ cardName: "", cardNumber: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();
  const cancelHandled = useRef(false);

  useEffect(() => {
    if (useCart.persist.hasHydrated()) setHydrated(true);
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // Returning from an abandoned Stripe payment: release the reserved stock.
  useEffect(() => {
    const canceled = searchParams.get("canceled");
    if (!canceled || cancelHandled.current) return;
    cancelHandled.current = true;
    void cancelPendingOrder({ number: canceled }).then(() => {
      toast("Payment cancelled", { description: "Your bag is just as you left it." });
      router.replace("/checkout");
    });
  }, [router, searchParams]);

  const address: AddressDraft = addressId === "new" ? draft : (addresses.find((a) => a.id === addressId) ?? draft);
  const subtotal = cartSubtotal(lines);
  const totals = computeTotals(subtotal, method, promo);

  function validateStep(index: number) {
    if (index === 0) {
      const res = addressSchema.safeParse(address);
      if (!res.success) {
        setErrors(fieldErrors(res.error));
        return false;
      }
    }
    if (index === 2 && paymentMode === "disabled") return false;
    if (index === 2 && paymentMode === "mock") {
      const res = cardSchema.safeParse(card);
      if (!res.success) {
        setErrors(fieldErrors(res.error));
        return false;
      }
    }
    setErrors({});
    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(index: number) {
    if (index < step) {
      setErrors({});
      setStep(index);
    }
  }

  function submit() {
    setServerError(null);
    startPlacing(async () => {
      const res = await placeOrder({
        items: lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
        address: { ...address, label: address.label || "Home" },
        saveAddress: addressId === "new" && saveAddress,
        deliveryMethod: method,
        promoCode: promo && subtotal >= promo.minSubtotal ? promo.code : undefined,
        card: paymentMode === "mock" ? card : undefined,
      });
      if (!res.ok) {
        setServerError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        // Refresh prices/stock so the bag reflects reality after a stock conflict.
        replace(await syncCart(lines.map(({ variantId, quantity }) => ({ variantId, quantity }))));
        return;
      }
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      router.push(`/checkout/success?order=${res.orderNumber}`);
    });
  }

  if (!hydrated) {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="skeleton h-12 rounded-full" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
        <div className="skeleton h-[480px] rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.4} />
        <h1 className="mt-6 font-display text-4xl">Your bag is empty</h1>
        <p className="mt-2 text-muted-foreground">Add something you love, then come back to check out.</p>
        <Button asChild className="mt-8">
          <Link href="/shop">
            Browse the collection <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
      <div>
        <h1 className="font-display text-display-md">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{email}</span>
        </p>

        {/* Progress */}
        <ol className="mt-8 flex items-center gap-2" aria-label="Checkout progress">
          {steps.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2">
                <button
                  onClick={() => goTo(i)}
                  disabled={i > step}
                  aria-current={current ? "step" : undefined}
                  className={cn("flex items-center gap-2 text-[13px] transition", current ? "text-foreground" : done ? "text-foreground/70 hover:text-foreground" : "text-muted-foreground")}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border text-[12px] font-medium transition-colors duration-500",
                      done && "border-foreground bg-foreground text-background",
                      current && "border-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <span className="relative h-px flex-1 bg-border">
                    <motion.span className="absolute inset-y-0 left-0 bg-foreground" initial={false} animate={{ width: done ? "100%" : "0%" }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="mt-8 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              aria-labelledby="step-title"
              className="rounded-2xl border bg-card p-6 sm:p-8"
            >
              {step === 0 && (
                <>
                  <h2 id="step-title" className="font-display text-3xl">Where should we send it?</h2>
                  {addresses.length > 0 && (
                    <RadioGroup value={addressId} onValueChange={setAddressId} className="mt-6 grid gap-3" aria-label="Saved addresses">
                      {addresses.map((a) => (
                        <RadioCard key={a.id} value={a.id}>
                          <div className="text-sm">
                            <p className="font-medium">
                              {a.label} {a.isDefault && <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Default</span>}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {a.fullName}, {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}
                            </p>
                          </div>
                        </RadioCard>
                      ))}
                      <RadioCard value="new">
                        <p className="text-sm font-medium">Use a new address</p>
                      </RadioCard>
                    </RadioGroup>
                  )}
                  <AnimatePresence initial={false}>
                    {addressId === "new" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-6">
                          <AddressFields value={draft} onChange={setDraft} errors={errors} idPrefix="ship" />
                          <div className="mt-6 flex items-center gap-3">
                            <Checkbox id="save-address" checked={saveAddress} onCheckedChange={(v) => setSaveAddress(v === true)} />
                            <Label htmlFor="save-address" className="font-normal">
                              Save this address to my account
                            </Label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {addressId !== "new" && Object.keys(errors).length > 0 && (
                    <p role="alert" className="mt-4 text-sm text-destructive">
                      This saved address is incomplete. Please choose “Use a new address”.
                    </p>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 id="step-title" className="font-display text-3xl">How fast do you need it?</h2>
                  <RadioGroup value={method} onValueChange={(v) => setMethod(v as DeliveryMethod)} className="mt-6 grid gap-3" aria-label="Delivery method">
                    {(Object.keys(deliveryOptions) as DeliveryMethod[]).map((m) => {
                      const opt = deliveryOptions[m];
                      const cost = computeTotals(subtotal, m, promo).shipping;
                      return (
                        <RadioCard key={m} value={m}>
                          <div className="flex flex-1 items-start justify-between gap-4 text-sm">
                            <div>
                              <p className="font-medium">
                                {opt.label} <span className="font-normal text-muted-foreground">· {opt.eta}</span>
                              </p>
                              <p className="mt-1 text-muted-foreground">{opt.description}</p>
                            </div>
                            <p className="tabular-nums">{cost === 0 ? <span className="text-success">Free</span> : formatPrice(cost)}</p>
                          </div>
                        </RadioCard>
                      );
                    })}
                  </RadioGroup>
                  {subtotal < FREE_SHIPPING_THRESHOLD && (
                    <p className="mt-4 text-[13px] text-muted-foreground">Standard shipping is free on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}.</p>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2 id="step-title" className="font-display text-3xl">Payment</h2>
                  {paymentMode === "disabled" ? (
                    <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.06] p-5 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      Online payments are temporarily unavailable. Please try again later or contact us to place your order.
                    </div>
                  ) : stripeEnabled ? (
                    <div className="mt-6 flex items-start gap-4 rounded-xl border bg-background p-5">
                      <ShieldCheck className="size-6 shrink-0 text-success" />
                      <div className="text-sm">
                        <p className="font-medium">Pay securely with Stripe</p>
                        <p className="mt-1 text-muted-foreground">
                          After reviewing your order you’ll be redirected to Stripe’s hosted checkout (test mode). Use card 4242 4242 4242 4242.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 rounded-xl border border-dashed bg-background p-4 text-[13px] text-muted-foreground">
                        <p className="font-medium text-foreground">Demo payment mode</p>
                        <p className="mt-1">
                          Use <span className="font-mono text-foreground">4242 4242 4242 4242</span>, any future expiry and any CVC. Try{" "}
                          <span className="font-mono text-foreground">4000 0000 0000 0002</span> to see a decline.
                        </p>
                      </div>
                      <div className="mt-6 grid gap-5 sm:grid-cols-6">
                        <FormField id="cardName" label="Name on card" error={errors.cardName} className="sm:col-span-6">
                          <Input value={card.cardName} onChange={(e) => setCard({ ...card, cardName: e.target.value })} autoComplete="cc-name" />
                        </FormField>
                        <FormField id="cardNumber" label="Card number" error={errors.cardNumber ?? errors["card.cardNumber"]} className="sm:col-span-6">
                          <Input
                            value={card.cardNumber}
                            onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="1234 1234 1234 1234"
                            className="font-mono tracking-wider"
                          />
                        </FormField>
                        <FormField id="expiry" label="Expiry" error={errors.expiry} className="sm:col-span-3">
                          <Input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" />
                        </FormField>
                        <FormField id="cvc" label="Security code" error={errors.cvc} className="sm:col-span-3">
                          <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" />
                        </FormField>
                      </div>
                    </>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <h2 id="step-title" className="font-display text-3xl">Review & place order</h2>
                  <dl className="mt-6 divide-y rounded-xl border bg-background">
                    {[
                      { label: "Ship to", step: 0, value: `${address.fullName}, ${address.line1}${address.line2 ? `, ${address.line2}` : ""}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}` },
                      { label: "Delivery", step: 1, value: `${deliveryOptions[method].label} · ${deliveryOptions[method].eta}` },
                      {
                        label: "Payment",
                        step: 2,
                        value: stripeEnabled ? "Stripe secure checkout" : `Card ending ${card.cardNumber.replace(/\s/g, "").slice(-4)}`,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-start gap-4 p-4 text-sm">
                        <dt className="w-20 shrink-0 text-muted-foreground">{row.label}</dt>
                        <dd className="flex-1">{row.value}</dd>
                        <button onClick={() => goTo(row.step)} className="text-[13px] underline underline-offset-4 hover:text-accent">
                          Edit
                        </button>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-5 text-[13px] text-muted-foreground">
                    By placing your order you agree to our <Link href="/terms" className="underline underline-offset-2">terms</Link> and{" "}
                    <Link href="/privacy" className="underline underline-offset-2">privacy policy</Link>.
                  </p>
                </>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => goTo(step - 1)}>
                    Back
                  </Button>
                ) : (
                  <span />
                )}
                {step < steps.length - 1 ? (
                  <Button size="lg" onClick={next}>
                    Continue to {steps[step + 1].label.toLowerCase()} <ArrowRight />
                  </Button>
                ) : (
                  <Button size="lg" variant="accent" onClick={submit} disabled={placing} className="min-w-56">
                    {placing ? (
                      <>
                        <Loader2 className="animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        <Lock /> {stripeEnabled ? "Continue to payment" : "Place order"} · {formatPrice(totals.total)}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start" aria-label="Order summary">
        <div className="space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
                  <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-foreground text-[10px] font-semibold text-background">{l.quantity}</span>
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block text-muted-foreground">{l.variantLabel}</span>
                </span>
                <span className="text-sm tabular-nums">{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <PromoCodeInput />
          <OrderTotals subtotal={subtotal} method={method} promo={promo} />
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
          <Lock className="size-3.5" /> 256-bit SSL encryption · Free 30-day returns
        </p>
      </aside>
    </div>
  );
}
