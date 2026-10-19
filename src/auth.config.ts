import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt) shared by middleware and the full server config.
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
