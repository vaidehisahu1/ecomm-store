/**
 * The seed wipes every table. This guard keeps it pointed at local databases unless someone
 * explicitly opts in, and never lets it run with NODE_ENV=production.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type SeedGuardResult = { ok: true; host: string } | { ok: false; reason: string };

export function checkSeedSafety(env: Record<string, string | undefined>): SeedGuardResult {
  if (env.NODE_ENV === "production") {
    return { ok: false, reason: "NODE_ENV is \"production\". The seed deletes all data and never runs in production." };
  }
  let host: string;
  try {
    // Compare the parsed hostname, not a substring, so "…neon.tech/db?x=localhost" can't slip through.
    host = new URL(env.DATABASE_URL ?? "").hostname;
  } catch {
    return { ok: false, reason: "DATABASE_URL is missing or not a valid URL." };
  }
  if (!LOCAL_HOSTS.has(host) && env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    return {
      ok: false,
      reason: `DATABASE_URL points at "${host}", which is not localhost/127.0.0.1. The seed would delete all data there. If you really mean it, re-run with ALLOW_DESTRUCTIVE_SEED=true.`,
    };
  }
  return { ok: true, host };
}
