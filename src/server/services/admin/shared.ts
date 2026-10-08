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

function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, member]) => member !== undefined)
        .map(([key, member]) => [key, withoutUndefined(member)]),
    );
  }
  return value;
}

/**
 * Builds an update that replaces an editor-owned document: top-level fields that are `undefined`
 * are removed and everything else is set. Nested objects are replaced as a whole, so their
 * `undefined` members drop out too, and `$set`/`$unset` never target overlapping paths.
 */
export function replaceFields(document: Record<string, unknown>) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};
  for (const [key, value] of Object.entries(document)) {
    if (value === undefined) $unset[key] = 1;
    else $set[key] = withoutUndefined(value);
  }
  return Object.keys($unset).length ? { $set, $unset } : { $set };
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
