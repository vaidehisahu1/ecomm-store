import { describe, expect, it } from "vitest";
import { checkSeedSafety } from "../prisma/seed-guard";

const local = "postgresql://u:p@localhost:5432/halden";
const neon = "postgresql://u:p@ep-green-123-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

describe("checkSeedSafety", () => {
  it.each([local, "postgresql://u:p@127.0.0.1:5432/db", "postgresql://u:p@[::1]:5432/db"])("allows local database %s", (url) => {
    expect(checkSeedSafety({ DATABASE_URL: url }).ok).toBe(true);
  });

  it("refuses a remote database without the opt-in, naming the host", () => {
    const r = checkSeedSafety({ DATABASE_URL: neon });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("ep-green-123-pooler.us-east-2.aws.neon.tech");
  });

  it("allows a remote database only with ALLOW_DESTRUCTIVE_SEED=true exactly", () => {
    expect(checkSeedSafety({ DATABASE_URL: neon, ALLOW_DESTRUCTIVE_SEED: "true" }).ok).toBe(true);
    expect(checkSeedSafety({ DATABASE_URL: neon, ALLOW_DESTRUCTIVE_SEED: "1" }).ok).toBe(false);
  });

  it("is not fooled by 'localhost' elsewhere in the URL", () => {
    expect(checkSeedSafety({ DATABASE_URL: `${neon}&application_name=localhost` }).ok).toBe(false);
    expect(checkSeedSafety({ DATABASE_URL: "postgresql://localhost:pw@db.example.com/x" }).ok).toBe(false);
  });

  it("always refuses in production, even with the opt-in or a local URL", () => {
    expect(checkSeedSafety({ NODE_ENV: "production", DATABASE_URL: local }).ok).toBe(false);
    expect(checkSeedSafety({ NODE_ENV: "production", DATABASE_URL: neon, ALLOW_DESTRUCTIVE_SEED: "true" }).ok).toBe(false);
  });

  it("refuses a missing or malformed DATABASE_URL", () => {
    expect(checkSeedSafety({}).ok).toBe(false);
    expect(checkSeedSafety({ DATABASE_URL: "not a url" }).ok).toBe(false);
  });
});
