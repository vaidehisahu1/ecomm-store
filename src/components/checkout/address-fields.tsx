"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/lib/countries";
import type { AddressInput } from "@/lib/validators";

export type AddressDraft = Omit<AddressInput, "isDefault">;

export const emptyAddress: AddressDraft = {
  label: "Home",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  phone: "",
};

/** Controlled address inputs shared by checkout and the address book. */
export function AddressFields({
  value,
  onChange,
  errors = {},
  idPrefix = "addr",
  showLabel = false,
}: {
  value: AddressDraft;
  onChange: (value: AddressDraft) => void;
  errors?: Record<string, string>;
  idPrefix?: string;
  showLabel?: boolean;
}) {
  const set = (key: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value });
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <div className="grid gap-5 sm:grid-cols-6">
      {showLabel && (
        <FormField id={id("label")} label="Label" error={errors.label} className="sm:col-span-6">
          <Input value={value.label} onChange={set("label")} placeholder="Home, Studio…" />
        </FormField>
      )}
      <FormField id={id("fullName")} label="Full name" error={errors.fullName} className="sm:col-span-6">
        <Input value={value.fullName} onChange={set("fullName")} autoComplete="name" />
      </FormField>
      <FormField id={id("line1")} label="Address" error={errors.line1} className="sm:col-span-6">
        <Input value={value.line1} onChange={set("line1")} autoComplete="address-line1" placeholder="Street and number" />
      </FormField>
      <FormField id={id("line2")} label="Apartment, suite, etc. (optional)" error={errors.line2} className="sm:col-span-6">
        <Input value={value.line2 ?? ""} onChange={set("line2")} autoComplete="address-line2" />
      </FormField>
      <FormField id={id("city")} label="City" error={errors.city} className="sm:col-span-3">
        <Input value={value.city} onChange={set("city")} autoComplete="address-level2" />
      </FormField>
      <FormField id={id("state")} label="State / Region" error={errors.state} className="sm:col-span-3">
        <Input value={value.state} onChange={set("state")} autoComplete="address-level1" />
      </FormField>
      <FormField id={id("postalCode")} label="Postal code" error={errors.postalCode} className="sm:col-span-2">
        <Input value={value.postalCode} onChange={set("postalCode")} autoComplete="postal-code" />
      </FormField>
      <div className="grid gap-2 sm:col-span-4">
        <label htmlFor={id("country")} className="text-[13px] font-medium leading-none text-foreground/85">
          Country
        </label>
        <Select value={value.country} onValueChange={(country) => onChange({ ...value, country })}>
          <SelectTrigger id={id("country")} aria-invalid={Boolean(errors.country)}>
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FormField id={id("phone")} label="Phone" error={errors.phone} hint="In case the courier needs to reach you" className="sm:col-span-6">
        <Input value={value.phone} onChange={set("phone")} autoComplete="tel" type="tel" />
      </FormField>
    </div>
  );
}
