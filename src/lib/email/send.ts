import "server-only";
import { Resend } from "resend";
import { isEmailConfigured } from "@/lib/env";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export type EmailResult = { sent: true; id: string } | { sent: false; reason: string };

let client: Resend | undefined;

/**
 * Sends a transactional email when a provider is configured. Callers treat email as
 * best-effort notification: the source of truth (an inquiry, a reset token) is always persisted
 * first, so a missing or failing provider never loses data.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "email-not-configured" };
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
    });
    if (error || !data) {
      console.error("[email] provider rejected message", {
        subject: message.subject,
        error: error?.name,
      });
      return { sent: false, reason: error?.name ?? "unknown-error" };
    }
    return { sent: true, id: data.id };
  } catch (error) {
    console.error("[email] send failed", {
      subject: message.subject,
      error: (error as Error).message,
    });
    return { sent: false, reason: "exception" };
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
