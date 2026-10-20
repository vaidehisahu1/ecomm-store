"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES, sniffImageType } from "@/lib/image-sniff";
import { after } from "next/server";
import { changeOrderStatus, sendOrderConfirmation } from "@/lib/orders";
import { fieldErrors, orderStatusSchema, productInputSchema } from "@/lib/validators";

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function revalidateCatalog(slug?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  if (slug) revalidatePath(`/product/${slug}`);
}

export async function saveProduct(input: unknown, id?: string): Promise<AdminResult> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { images, variants, specs, ...data } = parsed.data;

  const skus = variants.map((v) => v.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) return { ok: false, error: "Each variant needs a unique SKU.", fieldErrors: { variants: "Duplicate SKUs" } };

  const variantData = (v: (typeof variants)[number]) => ({
    sku: v.sku.toUpperCase(),
    size: v.size || null,
    color: v.color || null,
    colorHex: v.colorHex || null,
    price: v.price ?? null,
    stock: v.stock,
  });

  try {
    const product = await db.$transaction(async (tx) => {
      const base = { ...data, compareAt: data.compareAt || null, specs };
      if (!id) {
        return tx.product.create({
          data: {
            ...base,
            images: { create: images.map((img, position) => ({ ...img, alt: img.alt || data.name, position })) },
            variants: { create: variants.map(variantData) },
          },
        });
      }
      const existing = await tx.variant.findMany({ where: { productId: id }, select: { id: true } });
      const keep = new Set(variants.map((v) => v.id).filter(Boolean));
      await tx.variant.deleteMany({ where: { productId: id, id: { in: existing.map((e) => e.id).filter((e) => !keep.has(e)) } } });
      for (const v of variants) {
        if (v.id && existing.some((e) => e.id === v.id)) await tx.variant.update({ where: { id: v.id }, data: variantData(v) });
        else await tx.variant.create({ data: { ...variantData(v), productId: id } });
      }
      await tx.image.deleteMany({ where: { productId: id } });
      await tx.image.createMany({ data: images.map((img, position) => ({ ...img, alt: img.alt || data.name, position, productId: id })) });
      return tx.product.update({ where: { id }, data: base });
    });
    revalidateCatalog(product.slug);
    return { ok: true, id: product.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      if (target.includes("slug")) return { ok: false, error: "That URL slug is already used.", fieldErrors: { slug: "Already in use" } };
      return { ok: false, error: "A SKU is already used by another product.", fieldErrors: { variants: "SKU already in use" } };
    }
    throw error;
  }
}

export async function deleteProduct(input: unknown): Promise<AdminResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid product" };
  const product = await db.product.delete({ where: { id: parsed.data.id } }).catch(() => null);
  if (!product) return { ok: false, error: "Product not found" };
  revalidateCatalog(product.slug);
  return { ok: true };
}

export async function uploadImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose an image to upload" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Images must be 4 MB or smaller" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return { ok: false, error: "Images must be 4 MB or smaller" };
  // The type comes from the bytes; file.type and the filename are client-controlled and ignored.
  const image = sniffImageType(bytes);
  if (!image) return { ok: false, error: "That file isn’t a JPG, PNG, WebP or AVIF image" };
  const upload = await db.upload.create({ data: { mimeType: image.mime, size: bytes.byteLength, data: bytes }, select: { id: true } });
  return { ok: true, url: `/api/uploads/${upload.id}.${image.ext}` };
}

export async function updateOrderStatus(input: unknown): Promise<AdminResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), status: orderStatusSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  const { id, status } = parsed.data;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return { ok: false, error: "Order not found" };
  const change = await changeOrderStatus(db, id, order.status, status);
  if (!change.ok) return change;
  // An admin confirming payment manually gets the same confirmation email as an automatic payment.
  if (order.status === "PENDING" && status === "PAID") after(() => sendOrderConfirmation(id));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.number}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setMessageRead(input: unknown): Promise<AdminResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), isRead: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid message" };
  await db.contactMessage.update({ where: { id: parsed.data.id }, data: { isRead: parsed.data.isRead } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteMessage(input: unknown): Promise<AdminResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid message" };
  await db.contactMessage.delete({ where: { id: parsed.data.id } }).catch(() => null);
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
