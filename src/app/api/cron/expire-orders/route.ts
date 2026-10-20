import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireAbandonedOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Constant-time check of `Authorization: Bearer <CRON_SECRET>` (the header Vercel Cron sends). */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Releases stock held by Stripe orders that were never paid. Scheduled hourly in vercel.json. */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expired = await expireAbandonedOrders();
  return NextResponse.json({ expired: expired.length, orders: expired });
}
