import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Database-free parts of the Auth.js config. auth.ts adds the credentials provider and a
 * jwt callback that refreshes the user's role from the database.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const path = nextUrl.pathname;
      const needsAuth = ["/account", "/checkout", "/admin"].some((p) => path.startsWith(p));
      if (!needsAuth) return true;
      if (!user) return false;
      if (path.startsWith("/admin") && user.role !== "ADMIN") {
        return Response.redirect(new URL("/account", nextUrl));
      }
      return true;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
