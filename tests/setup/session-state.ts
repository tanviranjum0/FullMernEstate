import type { CurrentUser } from "@/lib/auth/session";

/** The signed-in user (or anonymous visitor) that integration tests act as. */
export const testSession: { user: CurrentUser | null; ip: string } = {
  user: null,
  ip: "203.0.113.10",
};

export function actAs(user: CurrentUser | null): void {
  testSession.user = user;
}
