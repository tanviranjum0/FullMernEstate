export type TrackedEvent =
  | "property_view"
  | "search"
  | "share"
  | "phone_click"
  | "email_click"
  | "whatsapp_click"
  | "compare";

/** Fire-and-forget beacon that never blocks navigation or interaction. */
export function track(name: TrackedEvent, subject?: string): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(subject ? { name, subject } : { name });
  try {
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through to fetch */
  }
  void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
    () => undefined,
  );
}
