import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { findVerifiedBuyers, withVerifiedFlag } from "@/lib/reviews";

function client(rows: { userId: string }[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  return { findMany, db: { order: { findMany } } as unknown as Prisma.TransactionClient };
}

describe("findVerifiedBuyers", () => {
  it("only counts paid orders that contain this product, for these reviewers", async () => {
    const { db, findMany } = client([{ userId: "u1" }]);
    const buyers = await findVerifiedBuyers(db, "p1", ["u1", "u2", "u1"]);
    expect(buyers).toEqual(new Set(["u1"]));
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: { in: ["u1", "u2"] }, status: { in: ["PAID", "SHIPPED", "DELIVERED"] }, items: { some: { productId: "p1" } } },
      select: { userId: true },
      distinct: ["userId"],
    });
  });

  it("skips the query when there are no reviews", async () => {
    const { db, findMany } = client([]);
    expect(await findVerifiedBuyers(db, "p1", [])).toEqual(new Set());
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("withVerifiedFlag", () => {
  it("marks only reviews whose author is a verified buyer", () => {
    const reviews = [
      { id: "r1", userId: "u1" },
      { id: "r2", userId: "u2" },
    ];
    expect(withVerifiedFlag(reviews, new Set(["u2"]))).toEqual([
      { id: "r1", userId: "u1", verified: false },
      { id: "r2", userId: "u2", verified: true },
    ]);
  });
});
