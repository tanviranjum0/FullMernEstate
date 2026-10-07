import "server-only";
import { Types } from "mongoose";
import { INQUIRY_STATUS_LABELS, ROLE_LABELS, type InquiryStatus, type UserRole } from "@/config/domain";
import type { CurrentUser } from "@/lib/auth/session";
import { canManageInquiry, hasPermission } from "@/lib/auth/permissions";
import { getMongoClient } from "@/lib/db/client";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AgentModel } from "@/server/models/agent";
import { InquiryModel } from "@/server/models/inquiry";
import { UserModel } from "@/server/models/user-data";
import { recordAudit } from "@/server/services/audit";
import { AdminActionError } from "./shared";

/* ----------------------------------------------------------------------------------------------
 * Users
 * --------------------------------------------------------------------------------------------*/

export async function updateUser(actor: CurrentUser, userId: string, patch: { role?: UserRole; disabled?: boolean }) {
  if (!hasPermission(actor.role, "users:manage")) throw new AdminActionError("You cannot manage users.", "forbidden");
  if (userId === actor.id) {
    throw new AdminActionError("You cannot change your own role or status. Ask another administrator.", "forbidden");
  }
  await connectToDatabase();
  const user = await UserModel.findById(userId, { email: 1, role: 1, disabled: 1 }).lean();
  if (!user) throw new AdminActionError("This user no longer exists.", "not_found");

  if (patch.role && patch.role !== "admin" && user.role === "admin") {
    const admins = await UserModel.countDocuments({ role: "admin", disabled: { $ne: true } });
    if (admins <= 1) throw new AdminActionError("There must always be at least one active administrator.", "conflict");
  }

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.role) set.role = patch.role;
  if (patch.disabled !== undefined) set.disabled = patch.disabled;
  await UserModel.updateOne({ _id: userId }, { $set: set });

  // Disabling an account takes effect immediately: every active session is revoked.
  if (patch.disabled) {
    await getMongoClient().db().collection("session").deleteMany({ userId: new Types.ObjectId(userId) });
  }
  if (patch.role && patch.role !== "agent") {
    await AgentModel.updateMany({ userId }, { $set: { userId: "" } });
  }

  const changes = [
    patch.role ? `role → ${ROLE_LABELS[patch.role]}` : null,
    patch.disabled !== undefined ? (patch.disabled ? "disabled" : "re-enabled") : null,
  ].filter(Boolean) as string[];
  await recordAudit(actor, "user.updated", "user", userId, `${user.email}: ${changes.join(", ")}`, changes);
}

/* ----------------------------------------------------------------------------------------------
 * Enquiries
 * --------------------------------------------------------------------------------------------*/

async function loadManageableInquiry(actor: CurrentUser, id: string) {
  await connectToDatabase();
  const inquiry = await InquiryModel.findById(id, { status: 1, assignedTo: 1, name: 1, email: 1 }).lean();
  if (!inquiry) throw new AdminActionError("This enquiry no longer exists.", "not_found");
  if (!canManageInquiry(actor, { assignedAgentId: inquiry.assignedTo?.toString() ?? null })) {
    throw new AdminActionError("This enquiry is not assigned to you.", "forbidden");
  }
  return inquiry;
}

export async function updateInquiry(
  actor: CurrentUser,
  id: string,
  patch: { status?: InquiryStatus; assignedTo?: string; note?: string },
) {
  const inquiry = await loadManageableInquiry(actor, id);
  const set: Record<string, unknown> = { lastActivityAt: new Date() };
  const changes: string[] = [];

  if (patch.status && patch.status !== inquiry.status) {
    set.status = patch.status;
    changes.push(`status → ${INQUIRY_STATUS_LABELS[patch.status]}`);
  }
  if (patch.assignedTo !== undefined) {
    if (!hasPermission(actor.role, "inquiries:manage_all")) {
      throw new AdminActionError("Only administrators can reassign enquiries.", "forbidden");
    }
    if (patch.assignedTo) {
      const agent = await AgentModel.findOne({ _id: patch.assignedTo, active: true }, { name: 1 }).lean();
      if (!agent) throw new AdminActionError("Choose an active advisor.", "validation", "assignedTo");
      set.assignedTo = agent._id;
      changes.push(`assigned → ${agent.name}`);
    } else {
      set.assignedTo = null;
      changes.push("unassigned");
    }
  }

  const update: Record<string, unknown> = { $set: set };
  if (patch.note) {
    update.$push = { notes: { authorId: actor.id, authorName: actor.name || actor.email, body: patch.note, createdAt: new Date() } };
    changes.push("note added");
  }
  if (changes.length === 0) return;
  await InquiryModel.updateOne({ _id: id }, update);
  await recordAudit(actor, "inquiry.updated", "inquiry", id, `Enquiry from ${inquiry.name}: ${changes.join(", ")}`, changes);
}
