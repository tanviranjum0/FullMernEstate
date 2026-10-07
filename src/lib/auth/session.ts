import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Types } from "mongoose";
import type { UserRole } from "@/config/domain";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AgentModel } from "@/server/models/agent";
import { UserModel } from "@/server/models/user-data";
import { getAuth } from "./auth";
import { hasPermission, isUserRole, type Permission } from "./permissions";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  role: UserRole;
  agentId: string | null;
}

/**
 * Resolves the signed-in user for this request. The session only proves identity; role and
 * disabled state are always re-read from the database so permission changes apply immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user?.id || !Types.ObjectId.isValid(session.user.id)) return null;

  await connectToDatabase();
  const user = await UserModel.findById(session.user.id, {
    name: 1,
    email: 1,
    image: 1,
    phone: 1,
    role: 1,
    disabled: 1,
  }).lean();
  if (!user || user.disabled) return null;

  const role: UserRole = isUserRole(user.role) ? user.role : "user";
  let agentId: string | null = null;
  if (role === "agent") {
    const agent = await AgentModel.findOne({ userId: session.user.id, active: true }, { _id: 1 }).lean();
    agentId = agent?._id.toString() ?? null;
  }

  return {
    id: session.user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    image: user.image ?? null,
    phone: user.phone ?? null,
    role,
    agentId,
  };
});

export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export type AuthorizationResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

export async function authorize(permission: Permission): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!hasPermission(user.role, permission)) return { ok: false, reason: "forbidden" };
  return { ok: true, user };
}
