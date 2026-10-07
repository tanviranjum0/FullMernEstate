import "server-only";
import type { Model } from "mongoose";
import { slugify } from "@/lib/slug";
import { RESERVED_SLUGS } from "@/lib/validation/admin";

/** Returns `desired` or the first free `desired-2`, `desired-3`, … for the given filter scope. */
export async function uniqueSlug<T>(
  model: Model<T>,
  desired: string,
  { excludeId, scope = {} }: { excludeId?: string; scope?: Record<string, unknown> } = {},
): Promise<string> {
  const base = slugify(desired) || "item";
  for (let attempt = 1; attempt < 200; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    const filter: Record<string, unknown> = { ...scope, slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    if (!(await model.exists(filter))) return candidate;
  }
  throw new Error("Could not allocate a unique slug");
}

export function storageKeysOf(images: { storageKey?: string | null }[] | undefined | null): Set<string> {
  return new Set((images ?? []).map((image) => image.storageKey).filter((key): key is string => Boolean(key)));
}

export class AdminActionError extends Error {
  constructor(
    message: string,
    public readonly code: "forbidden" | "not_found" | "conflict" | "validation" = "validation",
    public readonly field?: string,
  ) {
    super(message);
  }
}
