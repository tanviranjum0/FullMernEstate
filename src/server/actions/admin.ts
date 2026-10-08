"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { actionError, fieldErrorsFrom, type ActionResult } from "@/lib/actions";
import { authorize, type CurrentUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import { renderMarkdown } from "@/lib/security/markdown";
import {
  agentInput,
  articleInput,
  inquiryUpdateInput,
  locationInput,
  propertyInput,
  siteSettingsInput,
  userUpdateInput,
} from "@/lib/validation/admin";
import { deleteArticle, saveAgent, saveArticle, saveLocation, saveSiteSettings } from "@/server/services/admin/content";
import { updateInquiry, updateUser } from "@/server/services/admin/people";
import { deleteProperty, saveProperty, setPropertyStatus } from "@/server/services/admin/properties";
import { AdminActionError } from "@/server/services/admin/shared";

type Guarded<T> = (actor: CurrentUser) => Promise<ActionResult<T>>;

/** Authenticates, authorises and translates service errors for every admin mutation. */
async function guarded<T>(permission: Permission, run: Guarded<T>): Promise<ActionResult<T>> {
  const auth = await authorize(permission);
  if (!auth.ok) {
    return auth.reason === "unauthenticated"
      ? actionError("Your session has expired. Please sign in again.", "unauthenticated")
      : actionError("You do not have permission to do that.", "forbidden");
  }
  try {
    return await run(auth.user);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return actionError(error.message, error.code, error.field ? { [error.field]: error.message } : undefined);
    }
    if ((error as { code?: number }).code === 11000) {
      return actionError("Something with that name or URL already exists.", "conflict", { slug: "Already in use" });
    }
    console.error("[admin] action failed", { error: (error as Error).message });
    return actionError("The change could not be saved. Please try again.");
  }
}

function parse<S extends z.ZodType>(schema: S, input: unknown): { ok: true; data: z.output<S> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, result: actionError("Please correct the highlighted fields.", "validation", fieldErrorsFrom(parsed.error)) };
}

const validId = (id: unknown): id is string => typeof id === "string" && Types.ObjectId.isValid(id);

/* ------------------------------------------------------------------------------------------- */

export async function savePropertyAction(id: string | null, input: unknown) {
  return guarded<{ id: string; slug: string }>("admin:access", async (actor) => {
    if (id !== null && !validId(id)) return actionError("Listing not found.", "not_found");
    const parsed = parse(propertyInput, input);
    if (!parsed.ok) return parsed.result;
    const saved = await saveProperty(actor, id, parsed.data);
    revalidatePath("/admin/properties");
    return { ok: true, data: saved, message: "Listing saved." };
  });
}

export async function setPropertyStatusAction(id: string, status: "draft" | "published" | "archived") {
  return guarded<undefined>("admin:access", async (actor) => {
    if (!validId(id) || !["draft", "published", "archived"].includes(status)) return actionError("Invalid request.", "validation");
    await setPropertyStatus(actor, id, status);
    revalidatePath("/admin/properties");
    return { ok: true, data: undefined };
  });
}

export async function deletePropertyAction(id: string) {
  return guarded<undefined>("properties:manage_all", async (actor) => {
    if (!validId(id)) return actionError("Listing not found.", "not_found");
    await deleteProperty(actor, id);
    revalidatePath("/admin/properties");
    return { ok: true, data: undefined };
  });
}

export async function saveAgentAction(id: string | null, input: unknown) {
  return guarded<{ id: string; slug: string }>("agents:manage", async (actor) => {
    if (id !== null && !validId(id)) return actionError("Advisor not found.", "not_found");
    const parsed = parse(agentInput, input);
    if (!parsed.ok) return parsed.result;
    const saved = await saveAgent(actor, id, parsed.data);
    revalidatePath("/admin/agents");
    return { ok: true, data: saved, message: "Advisor saved." };
  });
}

export async function saveLocationAction(id: string | null, input: unknown) {
  return guarded<{ id: string; slug: string }>("locations:manage", async (actor) => {
    if (id !== null && !validId(id)) return actionError("Location not found.", "not_found");
    const parsed = parse(locationInput, input);
    if (!parsed.ok) return parsed.result;
    const saved = await saveLocation(actor, id, parsed.data);
    revalidatePath("/admin/locations");
    return { ok: true, data: saved, message: "Location saved." };
  });
}

export async function saveArticleAction(id: string | null, input: unknown) {
  return guarded<{ id: string; slug: string }>("content:manage", async (actor) => {
    if (id !== null && !validId(id)) return actionError("Article not found.", "not_found");
    const parsed = parse(articleInput, input);
    if (!parsed.ok) return parsed.result;
    const saved = await saveArticle(actor, id, parsed.data);
    revalidatePath("/admin/insights");
    return { ok: true, data: saved, message: "Article saved." };
  });
}

export async function deleteArticleAction(id: string) {
  return guarded<undefined>("content:manage", async (actor) => {
    if (!validId(id)) return actionError("Article not found.", "not_found");
    await deleteArticle(actor, id);
    revalidatePath("/admin/insights");
    return { ok: true, data: undefined };
  });
}

export async function previewMarkdownAction(markdown: unknown) {
  return guarded<{ html: string }>("admin:access", async () => {
    if (typeof markdown !== "string" || markdown.length > 60_000) return actionError("Invalid content.", "validation");
    return { ok: true, data: { html: renderMarkdown(markdown) } };
  });
}

export async function saveSettingsAction(input: unknown) {
  return guarded<undefined>("settings:manage", async (actor) => {
    const parsed = parse(siteSettingsInput, input);
    if (!parsed.ok) return parsed.result;
    await saveSiteSettings(actor, parsed.data);
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined, message: "Settings saved." };
  });
}

export async function updateUserAction(userId: string, patch: unknown) {
  return guarded<undefined>("users:manage", async (actor) => {
    if (!validId(userId)) return actionError("User not found.", "not_found");
    const parsed = parse(userUpdateInput, patch);
    if (!parsed.ok) return parsed.result;
    await updateUser(actor, userId, parsed.data);
    revalidatePath("/admin/users");
    return { ok: true, data: undefined, message: "User updated." };
  });
}

export async function updateInquiryAction(id: string, patch: unknown) {
  return guarded<undefined>("admin:access", async (actor) => {
    if (!validId(id)) return actionError("Enquiry not found.", "not_found");
    const parsed = parse(inquiryUpdateInput, patch);
    if (!parsed.ok) return parsed.result;
    await updateInquiry(actor, id, parsed.data);
    revalidatePath(`/admin/inquiries/${id}`);
    revalidatePath("/admin/inquiries");
    return { ok: true, data: undefined, message: "Enquiry updated." };
  });
}
