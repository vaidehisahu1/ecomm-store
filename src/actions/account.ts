"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { addressSchema, changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validators";

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(parsed.data.currentPassword, record.passwordHash))) {
    return { fieldErrors: { currentPassword: "That doesn’t match your current password" } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  return { ok: true };
}

const saveAddressSchema = addressSchema.extend({ id: z.string().optional() });

export async function saveAddress(input: unknown): Promise<FormState> {
  const user = await requireUser();
  const parsed = saveAddressSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { id, isDefault, ...data } = parsed.data;
  const normalized = { ...data, line2: data.line2 || null };

  await db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: user.id } });
    const makeDefault = isDefault || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (id) {
      const res = await tx.address.updateMany({ where: { id, userId: user.id }, data: { ...normalized, ...(makeDefault && { isDefault: true }) } });
      if (res.count === 0) throw new Error("Address not found");
    } else {
      await tx.address.create({ data: { ...normalized, isDefault: makeDefault, userId: user.id } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true };
}

const idSchema = z.object({ id: z.string().min(1) });

export async function deleteAddress(input: unknown): Promise<FormState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid address" };
  const address = await db.address.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!address) return { error: "Address not found" };
  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const next = await tx.address.findFirst({ where: { userId: user.id } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddress(input: unknown): Promise<FormState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid address" };
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id: parsed.data.id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true };
}
