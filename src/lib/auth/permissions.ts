import type { UserRole } from "@/config/domain";

export const PERMISSIONS = [
  "admin:access",
  "dashboard:view",
  "properties:manage_all",
  "properties:manage_own",
  "properties:publish",
  "inquiries:manage_all",
  "inquiries:manage_own",
  "agents:manage",
  "users:manage",
  "content:manage",
  "locations:manage",
  "settings:manage",
  "audit:read",
  "media:upload",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  user: [],
  agent: [
    "admin:access",
    "dashboard:view",
    "properties:manage_own",
    "properties:publish",
    "inquiries:manage_own",
    "media:upload",
  ],
  editor: [
    "admin:access",
    "dashboard:view",
    "content:manage",
    "locations:manage",
    "media:upload",
  ],
  admin: PERMISSIONS,
};

export function isUserRole(value: unknown): value is UserRole {
  return value === "user" || value === "agent" || value === "editor" || value === "admin";
}

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Whether an actor may modify a property. Admins manage every listing; advisors only listings
 * assigned to their own advisor profile. Ownership is always resolved server-side.
 */
export function canManageProperty(
  actor: { role: UserRole; agentId: string | null },
  property: { agentId: string | null },
): boolean {
  if (hasPermission(actor.role, "properties:manage_all")) return true;
  if (!hasPermission(actor.role, "properties:manage_own")) return false;
  return Boolean(actor.agentId) && actor.agentId === property.agentId;
}

export function canManageInquiry(
  actor: { role: UserRole; agentId: string | null },
  inquiry: { assignedAgentId: string | null },
): boolean {
  if (hasPermission(actor.role, "inquiries:manage_all")) return true;
  if (!hasPermission(actor.role, "inquiries:manage_own")) return false;
  return Boolean(actor.agentId) && actor.agentId === inquiry.assignedAgentId;
}
