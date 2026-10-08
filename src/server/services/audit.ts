import "server-only";
import type { CurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getClientIp, hashIdentifier } from "@/lib/security/request";
import { AuditLogModel } from "@/server/models/system";

export type AuditEntity =
  "property" | "agent" | "location" | "article" | "inquiry" | "user" | "settings" | "media";

/**
 * Records a significant administrative action. Audit writes are awaited so that an action is
 * never reported as successful without its trail, but they store no secrets or raw IPs.
 */
export async function recordAudit(
  actor: CurrentUser,
  action: string,
  entityType: AuditEntity,
  entityId: string,
  summary: string,
  changes: string[] = [],
): Promise<void> {
  await connectToDatabase();
  await AuditLogModel.create({
    actor: { id: actor.id, email: actor.email, role: actor.role },
    action,
    entityType,
    entityId,
    summary: summary.slice(0, 500),
    changes: changes.slice(0, 50),
    ipHash: hashIdentifier(await getClientIp()),
  });
}

/** Lists the top-level fields whose values differ, for a compact human-readable audit trail. */
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .sort();
}
