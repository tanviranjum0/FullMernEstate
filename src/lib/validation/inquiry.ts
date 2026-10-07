import { z } from "zod";
import { CONTACT_METHODS, INQUIRY_TYPES, VIEWING_TIME_SLOTS } from "@/config/domain";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid reference");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const MAX_VIEWING_DAYS_AHEAD = 180;

/**
 * Shared by the client form (instant feedback) and the server action (authoritative check).
 * The `website` field is a honeypot: humans never see it, simple bots fill it in.
 */
export const inquirySchema = z
  .object({
    type: z.enum(INQUIRY_TYPES),
    propertyId: objectId.optional().or(z.literal("").transform(() => undefined)),
    agentId: objectId.optional().or(z.literal("").transform(() => undefined)),
    name: z.string().trim().min(2, "Please enter your name").max(120, "That name is too long"),
    email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address").max(254)),
    phone: optionalText(40).refine(
      (value) => !value || /^\+?[\d\s()-]{7,20}$/.test(value),
      "Please enter a valid phone number",
    ),
    preferredContact: z.enum(CONTACT_METHODS).default("email"),
    message: optionalText(4000),
    viewingDate: optionalText(10).refine(
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Please choose a valid date",
    ),
    viewingTimeSlot: z.enum(VIEWING_TIME_SLOTS).optional().or(z.literal("").transform(() => undefined)),
    consent: z
      .union([z.literal("on"), z.literal(true), z.literal("true")])
      .optional()
      .refine((value) => value !== undefined, "Please confirm we may contact you about this enquiry"),
    website: z.string().max(0, "Invalid submission").optional().or(z.literal("")),
    sourcePath: optionalText(500),
  })
  .superRefine((data, ctx) => {
    if ((data.preferredContact === "phone" || data.preferredContact === "whatsapp") && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Add a phone number so we can call you" });
    }
    if (data.type === "viewing") {
      if (!data.viewingDate) {
        ctx.addIssue({ code: "custom", path: ["viewingDate"], message: "Choose a preferred date" });
      } else {
        const chosen = new Date(`${data.viewingDate}T00:00:00Z`).getTime();
        const today = new Date(new Date().toISOString().slice(0, 10)).getTime();
        if (Number.isNaN(chosen) || chosen < today || chosen > today + MAX_VIEWING_DAYS_AHEAD * 86_400_000) {
          ctx.addIssue({ code: "custom", path: ["viewingDate"], message: "Choose a date within the next six months" });
        }
      }
    }
    if ((data.type === "property" || data.type === "viewing") && !data.propertyId) {
      ctx.addIssue({ code: "custom", path: ["propertyId"], message: "Missing property reference" });
    }
    if (data.type === "general" && !data.message) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "Tell us a little about what you are looking for" });
    }
  });

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryData = z.output<typeof inquirySchema>;
