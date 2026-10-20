/**
 * Sets a user's password without reseeding.
 *
 *   npm run admin:set-password -- <email> <new-password>
 *
 * Targets the database in DATABASE_URL (from .env). Tip: prefix the command with a space so most
 * shells keep the password out of history, and rotate it again if it was ever exposed.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { passwordSchema } from "@/lib/validators";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run admin:set-password -- <email> <new-password>");
    process.exit(1);
  }
  const parsedEmail = z.string().trim().toLowerCase().email().safeParse(email);
  if (!parsedEmail.success) {
    console.error(`"${email}" is not a valid email address.`);
    process.exit(1);
  }
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    console.error(`Password rejected: ${parsedPassword.error.issues.map((i) => i.message).join(", ")}.`);
    process.exit(1);
  }

  const db = new PrismaClient();
  try {
    const host = new URL(process.env.DATABASE_URL ?? "postgresql://unknown").hostname;
    const user = await db.user.findUnique({ where: { email: parsedEmail.data }, select: { id: true, role: true } });
    if (!user) {
      console.error(`No user with email ${parsedEmail.data} on ${host}.`);
      process.exit(1);
    }
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsedPassword.data, 12) } });
    console.log(`✓ Password updated for ${parsedEmail.data} (${user.role}) on ${host}.`);
    console.log("  Existing sessions stay valid until they expire; ask the user to sign in again.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
