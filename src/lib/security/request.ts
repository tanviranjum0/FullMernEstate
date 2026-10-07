import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServerEnv } from "@/lib/env";

/**
 * Client IP as reported by the platform proxy. On Vercel `x-forwarded-for` is set by the edge
 * network and cannot be spoofed by the client; elsewhere it is only as trustworthy as the proxy.
 */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || requestHeaders.get("x-real-ip") || "unknown";
}

/** One-way, salted hash so abuse can be correlated without storing raw IP addresses. */
export function hashIdentifier(value: string): string {
  return createHash("sha256")
    .update(`${getServerEnv().BETTER_AUTH_SECRET}:${value}`)
    .digest("hex")
    .slice(0, 32);
}

export async function getUserAgent(): Promise<string> {
  return ((await headers()).get("user-agent") ?? "").slice(0, 300);
}
