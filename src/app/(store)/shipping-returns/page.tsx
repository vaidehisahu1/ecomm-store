import type { Metadata } from "next";
import { PageHero } from "@/components/common/page-hero";
import { Prose } from "@/components/common/prose";
import { deliveryOptions, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { shippingCountryCount } from "@/lib/perks";
import { policies } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipping & returns", description: `Delivery options, timings and our free ${policies.returns.days}-day returns policy.` };

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHero eyebrow="Shipping & returns" title={<>Delivered with care. <em>Returned with ease.</em></>} />
      <div className="container-page">
        <Prose>
          <h2>Delivery options</h2>
          <p>All orders are packed by hand in our San Francisco studio and ship carbon-neutral in plastic-free packaging.</p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Estimated delivery</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(deliveryOptions).map((o) => (
                  <tr key={o.label}>
                    <td>{o.label}</td>
                    <td>{o.eta}</td>
                    <td>
                      {formatPrice(o.price)}
                      {o.label === "Standard" && ` · free over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>You’ll receive tracking details by email as soon as your order leaves the studio. You can also follow its progress from your account.</p>

          <h2>Returns</h2>
          <p>
            Changed your mind? Return any unworn item in its original condition within <strong>{policies.returns.days} days</strong> of delivery for a full refund to your original
            payment method. Returns are free within the US.
          </p>
          <ul>
            <li>Start a return from the order page in your account, or contact us with your order number.</li>
            <li>Print the prepaid label, pack your items in the original box, and drop it off at any UPS location.</li>
            <li>Refunds are processed within 3 business days of your return arriving at the studio.</li>
          </ul>
          <h3>Exceptions</h3>
          <p>For hygiene reasons: {policies.returns.exclusions}</p>

          <h2>International orders</h2>
          <p>We currently ship to {shippingCountryCount} countries. Duties and taxes are calculated at checkout so there are no surprises at the door.</p>
        </Prose>
      </div>
    </>
  );
}
