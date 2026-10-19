import type { Metadata } from "next";
import { PageHero } from "@/components/common/page-hero";
import { Prose } from "@/components/common/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy", description: "How Halden collects, uses and protects your personal information." };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" intro="Last updated 1 October 2026" />
      <div className="container-page">
        <Prose>
          <p>
            Your privacy matters to us. This policy explains what personal information {site.name} collects, why we collect it, and the choices you have.
            We only collect what we need to run the store and never sell your data.
          </p>
          <h2>Information we collect</h2>
          <ul>
            <li><strong>Account details</strong> — your name, email address, phone number and a securely hashed password.</li>
            <li><strong>Order information</strong> — shipping addresses, items purchased and the last four digits of your card. Full card numbers are handled by our payment processor and never touch our servers.</li>
            <li><strong>Communications</strong> — messages you send through our contact form and newsletter preferences.</li>
            <li><strong>Usage data</strong> — basic, privacy-preserving analytics about how pages perform.</li>
          </ul>
          <h2>How we use it</h2>
          <p>We use your information to process and deliver orders, provide customer support, prevent fraud, and — if you’ve opted in — send occasional emails about new products.</p>
          <h2>Cookies</h2>
          <p>We use essential cookies to keep you signed in and remember your bag. We do not use third-party advertising cookies.</p>
          <h2>Your rights</h2>
          <p>You can access, correct or delete your personal information at any time from your account or by emailing {site.email}. EU and California residents have additional rights under GDPR and CCPA, which we honour for all customers.</p>
          <h2>Contact</h2>
          <p>Questions about this policy? Write to {site.email} or {site.address}.</p>
        </Prose>
      </div>
    </>
  );
}
