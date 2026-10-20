import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";

/**
 * A real cost-12 bcrypt hash of a random throwaway value. Comparing against it when the email
 * is unknown makes "no such user" take as long as "wrong password", so response timing doesn't
 * reveal which emails have accounts.
 */
const DUMMY_HASH = "$2b$12$obfC6z2jc8XS/4agO3nMR.EwGSFTOBTCpR3gk0ojnsF4TsIVSeoQO";

/** How often a session's role is re-read from the database, so demotions apply without waiting for expiry. */
export const ROLE_REFRESH_MS = 10 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleCheckedAt = Date.now();
        return token;
      }
      if (Date.now() - Number(token.roleCheckedAt ?? 0) > ROLE_REFRESH_MS) {
        const fresh = await db.user.findUnique({ where: { id: token.id as string }, select: { role: true } });
        if (!fresh) return null; // account deleted: end the session
        token.role = fresh.role;
        token.roleCheckedAt = Date.now();
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        // Backstop for direct POSTs to /api/auth/callback/credentials, which bypass the login action.
        if (!(await rateLimit("credentials", request.headers)).success) return null;
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) {
          await bcrypt.compare(parsed.data.password, DUMMY_HASH);
          return null;
        }
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
