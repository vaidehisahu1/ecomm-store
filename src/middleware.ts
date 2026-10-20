// Uses the full Auth.js config (not just auth.config) so the DB-backed jwt callback can refresh the
// user's role and write the updated token cookie on protected routes.
export { auth as default } from "@/auth";

export const config = {
  // Node.js runtime (stable in Next 15.5): needed for Prisma in the jwt callback and Auth.js's JWT library.
  runtime: "nodejs",
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
