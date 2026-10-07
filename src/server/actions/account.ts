"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, fieldErrorsFrom, formDataToObject, type ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { PropertyModel } from "@/server/models/property";
import { RecentViewModel, UserModel } from "@/server/models/user-data";

const MAX_RECENT_VIEWS = 30;

export async function recordRecentViewAction(propertyId: unknown): Promise<void> {
  if (typeof propertyId !== "string" || !Types.ObjectId.isValid(propertyId)) return;
  const user = await getCurrentUser();
  if (!user) return;
  await connectToDatabase();
  if (!(await PropertyModel.exists({ _id: propertyId, status: "published" }))) return;
  const userId = new Types.ObjectId(user.id);
  await RecentViewModel.updateOne(
    { user: userId, property: new Types.ObjectId(propertyId) },
    { $set: { viewedAt: new Date() } },
    { upsert: true },
  );
  const stale = await RecentViewModel.find({ user: userId }, { _id: 1 })
    .sort({ viewedAt: -1 })
    .skip(MAX_RECENT_VIEWS)
    .lean();
  if (stale.length) await RecentViewModel.deleteMany({ _id: { $in: stale.map((row) => row._id) } });
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((value) => !value || /^\+?[\d\s()-]{7,20}$/.test(value), "Please enter a valid phone number")
    .optional()
    .transform((value) => value || ""),
});

export type ProfileActionState = ActionResult | null;

/** Only name and phone are user-editable; role, email and status can never be set here. */
export async function updateProfileAction(_previous: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) return actionError("Please sign in again.", "unauthenticated");

  const limit = await consumeRateLimit(`account:${user.id}`, RATE_LIMITS.accountUpdate);
  if (!limit.allowed) return actionError("Too many updates. Please wait a few minutes.", "rate_limited");

  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return actionError("Please check the highlighted fields.", "validation", fieldErrorsFrom(parsed.error));

  await connectToDatabase();
  await UserModel.updateOne(
    { _id: new Types.ObjectId(user.id) },
    { $set: { name: parsed.data.name, phone: parsed.data.phone, updatedAt: new Date() } },
  );
  revalidatePath("/account", "layout");
  return { ok: true, data: undefined, message: "Your details have been updated." };
}
