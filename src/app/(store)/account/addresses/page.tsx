import type { Metadata } from "next";
import { AddressBook } from "@/components/account/address-book";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
  return (
    <AddressBook
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
