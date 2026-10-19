/**
 * Normalises a post-login redirect target to a same-site path.
 * Absolute URLs (Auth.js middleware sends these) are reduced to their path, so the
 * parameter can never send someone to another origin.
 */
export function safeRedirect(target: unknown, fallback = "/account") {
  if (typeof target !== "string" || !target) return fallback;
  try {
    const url = new URL(target, "http://local.invalid");
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/login") ? path : fallback;
  } catch {
    return fallback;
  }
}
