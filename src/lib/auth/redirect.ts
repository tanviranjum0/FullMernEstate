/**
 * Accepts only same-origin relative paths for post-auth redirects, preventing open-redirects
 * such as `//evil.example` or `https://evil.example`.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(value) || value.length > 500) return fallback;
  return value;
}
