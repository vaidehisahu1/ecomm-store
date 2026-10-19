import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/common/contact-form";
import { PageHero } from "@/components/common/page-hero";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "Questions about an order, a product or a repair? The Halden studio is here to help." };

export default function ContactPage() {
  const details = [
    { icon: Mail, label: "Email", value: site.email },
    { icon: Phone, label: "Phone", value: site.phone },
    { icon: MapPin, label: "Studio & showroom", value: site.address },
    { icon: Clock, label: "Hours", value: "Mon–Fri 9am–6pm PT · Sat 10am–4pm" },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title={<>We’d love to <em>hear from you</em>.</>} intro="Questions about sizing, an order or a repair? Our studio team answers every message personally — usually within a day." />
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <ul className="space-y-8">
          {details.map((d) => (
            <li key={d.label} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border">
                <d.icon className="size-[18px] text-accent" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-[13px] text-muted-foreground">{d.label}</p>
                <p className="mt-0.5 font-medium">{d.value}</p>
              </div>
            </li>
          ))}
        </ul>
        <ContactForm />
      </div>
    </>
  );
}
