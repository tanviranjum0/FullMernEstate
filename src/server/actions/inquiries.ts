"use server";

import { actionError, fieldErrorsFrom, formDataToObject, type ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent, hashIdentifier } from "@/lib/security/request";
import { inquirySchema } from "@/lib/validation/inquiry";
import { createInquiry, InquiryTargetError } from "@/server/services/inquiries";

export type InquiryActionState = ActionResult<{ reference: string }> | null;

export async function submitInquiryAction(_previous: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  const parsed = inquirySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return actionError("Please check the highlighted fields.", "validation", fieldErrorsFrom(parsed.error));
  }

  const ipHash = hashIdentifier(await getClientIp());
  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`inquiry:ip:${ipHash}`, RATE_LIMITS.inquiry),
    consumeRateLimit(`inquiry:email:${hashIdentifier(parsed.data.email)}`, { limit: 10, windowSeconds: 60 * 60 * 24 }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return actionError(
      "We have received several enquiries from you recently. Please try again later or contact us directly.",
      "rate_limited",
    );
  }

  const user = await getCurrentUser();
  try {
    const result = await createInquiry(parsed.data, {
      userId: user?.id ?? null,
      ipHash,
      userAgent: await getUserAgent(),
    });
    return {
      ok: true,
      data: { reference: result.reference },
      message: result.duplicate ? "We already have this enquiry — no need to send it again." : undefined,
    };
  } catch (error) {
    if (error instanceof InquiryTargetError) return actionError(error.message, "not_found");
    console.error("[inquiry] failed to create", { error: (error as Error).message });
    return actionError("Something went wrong on our side and your enquiry was not sent. Please try again.");
  }
}
