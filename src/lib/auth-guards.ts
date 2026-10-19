import "server-only";
import { auth } from "@/auth";

export class AuthorizationError extends Error {}

/** Returns the signed-in user or throws. Use inside server actions. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthorizationError("You need to be signed in.");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthorizationError("You don't have access to this.");
  return user;
}
