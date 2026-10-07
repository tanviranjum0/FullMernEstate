import "server-only";
import { after } from "next/server";
import { Types } from "mongoose";
import { INQUIRY_TYPE_LABELS, VIEWING_TIME_SLOT_LABELS } from "@/config/domain";
import { siteConfig } from "@/config/site";
import { connectToDatabase } from "@/lib/db/mongoose";
import { escapeHtml, sendEmail } from "@/lib/email/send";
import type { InquiryData } from "@/lib/validation/inquiry";
import { AgentModel } from "@/server/models/agent";
import { InquiryModel } from "@/server/models/inquiry";
import { PropertyModel } from "@/server/models/property";
import { recordMetric } from "./metrics";

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export class InquiryTargetError extends Error {}

export interface CreateInquiryContext {
  userId: string | null;
  ipHash: string;
  userAgent: string;
}

/** Short, human-friendly reference shown to the client and to staff. */
export function inquiryReference(id: string): string {
  return id.slice(-6).toUpperCase();
}

/**
 * Persists an enquiry first (the source of truth), then notifies staff by email on a
 * best-effort basis. Identical submissions within two minutes return the original reference
 * instead of creating duplicates.
 */
export async function createInquiry(data: InquiryData, context: CreateInquiryContext) {
  await connectToDatabase();

  let property: { _id: Types.ObjectId; title: string; slug: string; agent?: Types.ObjectId | null } | null = null;
  if (data.propertyId) {
    property = await PropertyModel.findOne(
      { _id: data.propertyId, status: "published" },
      { title: 1, slug: 1, agent: 1 },
    ).lean();
    if (!property) throw new InquiryTargetError("This property is no longer available.");
  }

  let agentId: Types.ObjectId | null = property?.agent ?? null;
  if (!agentId && data.agentId) {
    const agent = await AgentModel.findOne({ _id: data.agentId, active: true }, { _id: 1 }).lean();
    if (!agent) throw new InquiryTargetError("This advisor is no longer available.");
    agentId = agent._id;
  }

  const duplicate = await InquiryModel.findOne(
    {
      email: data.email,
      type: data.type,
      property: property?._id ?? null,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    { _id: 1 },
  ).lean();
  if (duplicate) return { reference: inquiryReference(duplicate._id.toString()), duplicate: true };

  const inquiry = await InquiryModel.create({
    type: data.type,
    status: "new",
    property: property?._id,
    propertySnapshot: property ? { title: property.title, slug: property.slug } : undefined,
    agent: agentId ?? undefined,
    assignedTo: agentId ?? undefined,
    user: context.userId && Types.ObjectId.isValid(context.userId) ? new Types.ObjectId(context.userId) : undefined,
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    preferredContact: data.preferredContact,
    message: data.message ?? "",
    viewing:
      data.type === "viewing" && data.viewingDate
        ? { date: new Date(`${data.viewingDate}T00:00:00Z`), timeSlot: data.viewingTimeSlot ?? null }
        : undefined,
    consent: true,
    source: { path: data.sourcePath ?? "" },
    meta: { ipHash: context.ipHash, userAgent: context.userAgent },
  });

  await recordMetric(data.type === "viewing" ? "viewing_request" : "inquiry", property?._id.toString() ?? "");
  // Runs after the response is sent; the function stays alive until it finishes.
  after(() => notifyStaff(inquiry._id.toString(), data, property, agentId));

  return { reference: inquiryReference(inquiry._id.toString()), duplicate: false };
}

async function notifyStaff(
  inquiryId: string,
  data: InquiryData,
  property: { title: string; slug: string } | null,
  agentId: Types.ObjectId | null,
) {
  const recipients = new Set<string>();
  if (process.env.LEAD_NOTIFICATION_EMAIL) recipients.add(process.env.LEAD_NOTIFICATION_EMAIL);
  if (agentId) {
    const agent = await AgentModel.findById(agentId, { email: 1 }).lean();
    if (agent?.email && !agent.email.endsWith("@example.com")) recipients.add(agent.email);
  }
  if (recipients.size === 0) return;

  const label = INQUIRY_TYPE_LABELS[data.type];
  const adminUrl = `${siteConfig.url}/admin/inquiries/${inquiryId}`;
  const lines = [
    `${label} — reference ${inquiryReference(inquiryId)}`,
    property ? `Property: ${property.title} (${siteConfig.url}/properties/${property.slug})` : null,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `Preferred contact: ${data.preferredContact}`,
    data.viewingDate
      ? `Viewing: ${data.viewingDate}${data.viewingTimeSlot ? `, ${VIEWING_TIME_SLOT_LABELS[data.viewingTimeSlot]}` : ""}`
      : null,
    data.message ? `\n${data.message}` : null,
    `\nManage: ${adminUrl}`,
  ].filter(Boolean) as string[];

  await sendEmail({
    to: [...recipients],
    replyTo: data.email,
    subject: `${label}${property ? `: ${property.title}` : ""}`,
    text: lines.join("\n"),
    html: lines.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`).join(""),
  });
}
