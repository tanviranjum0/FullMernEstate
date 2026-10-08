import "server-only";
import { notFound } from "next/navigation";
import { hasPermission, type Permission } from "./permissions";
import { requireUser, type CurrentUser } from "./session";

/** Page-level guard for admin routes; a missing permission renders a 404 rather than leaking structure. */
export async function requireAdminPermission(
  permissions: Permission | Permission[],
  returnTo: string,
): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  const list = Array.isArray(permissions) ? permissions : [permissions];
  if (!list.some((permission) => hasPermission(user.role, permission))) notFound();
  return user;
}
