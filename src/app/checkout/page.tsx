import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { db } from "@/lib/db";
import { isStripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");
  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return (
    <CheckoutFlow
      email={session.user.email ?? ""}
      stripeEnabled={isStripeEnabled}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.fullName,
        line1: a.line1,
        line2: a.line2 ?? "",
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country,
        phone: a.phone,
        isDefault: a.isDefault,
      }))}
    />
  );
}
