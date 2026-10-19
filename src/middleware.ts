import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Node.js runtime (stable in Next 15.5) avoids Edge-incompatible APIs in Auth.js's JWT library.
  runtime: "nodejs",
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
