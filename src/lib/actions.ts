import type { z } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; code?: ActionErrorCode };

export type ActionErrorCode =
  "unauthenticated" | "forbidden" | "rate_limited" | "validation" | "not_found" | "conflict";

export function actionError(
  error: string,
  code?: ActionErrorCode,
  fieldErrors?: Record<string, string>,
): { ok: false; error: string; code?: ActionErrorCode; fieldErrors?: Record<string, string> } {
  return { ok: false, error, code, fieldErrors };
}

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}

/** Converts FormData into a plain object, collapsing repeated keys into arrays. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    const normalised = typeof value === "string" ? value : value;
    if (key in result) {
      const current = result[key];
      result[key] = Array.isArray(current) ? [...current, normalised] : [current, normalised];
    } else {
      result[key] = normalised;
    }
  }
  return result;
}
