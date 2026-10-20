import type { Prisma, PrismaClient } from "@prisma/client";

/** Any Prisma client or interactive-transaction client. Injected so each step can be unit tested. */
export type DbClient = Prisma.TransactionClient;
/** A client that can open transactions (the real PrismaClient in production). */
export type TransactionalDb = Pick<PrismaClient, "$transaction">;

/** Steps report expected business failures as values; only unexpected failures throw. */
export type StepResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const variantWithProduct = {
  product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } },
} satisfies Prisma.VariantInclude;

export type VariantWithProduct = Prisma.VariantGetPayload<{ include: typeof variantWithProduct }>;

/** A server-priced cart line. `unitPrice` is integer cents and never comes from the client. */
export type OrderLine = { variant: VariantWithProduct; quantity: number; unitPrice: number };
