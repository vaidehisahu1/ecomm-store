import type { Metadata } from "next";
import { PageHero } from "@/components/common/page-hero";
import { Prose } from "@/components/common/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of service", description: "The terms that apply when you use the Halden website and purchase from us." };

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of service" intro="Last updated 1 October 2026" />
      <div className="container-page">
        <Prose>
          <p>These terms apply to your use of the {site.name} website and any purchase you make from us. By placing an order you agree to them.</p>
          <h2>Orders</h2>
          <p>An order is accepted once we send a confirmation email. We reserve the right to cancel orders in cases of pricing errors, suspected fraud or stock unavailability, in which case you’ll receive a full refund.</p>
          <h2>Pricing</h2>
          <p>Prices are shown in US dollars and include applicable duties for domestic orders. Sales tax is calculated at checkout based on your delivery address.</p>
          <h2>Promotions</h2>
          <p>Promo codes are limited to one per order, cannot be exchanged for cash and may be withdrawn at any time. Minimum spend thresholds apply to the subtotal before tax and shipping.</p>
          <h2>Warranty & repairs</h2>
          <p>Our lifetime repair programme covers normal wear on leather goods and footwear. It does not cover loss, theft or deliberate damage. Electronics carry a two-year limited warranty.</p>
          <h2>Liability</h2>
          <p>To the extent permitted by law, our liability is limited to the value of the products you purchased. Nothing in these terms affects your statutory rights.</p>
          <h2>Contact</h2>
          <p>{site.name} Studio ApS · {site.address} · {site.email}</p>
        </Prose>
      </div>
    </>
  );
}
