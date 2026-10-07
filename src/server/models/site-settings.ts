import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { faqSchema, mediaImageSchema } from "./shared";

const testimonialSchema = new Schema(
  {
    quote: { type: String, required: true, maxlength: 1_200, trim: true },
    author: { type: String, required: true, maxlength: 120, trim: true },
    context: { type: String, default: "", maxlength: 160, trim: true },
    published: { type: Boolean, default: false },
  },
  { _id: true },
);

const valueSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120, trim: true },
    text: { type: String, required: true, maxlength: 600, trim: true },
  },
  { _id: true },
);

const siteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    contact: {
      email: { type: String, default: "", maxlength: 254, trim: true },
      phone: { type: String, default: "", maxlength: 40, trim: true },
      whatsapp: { type: String, default: "", maxlength: 40, trim: true },
      address: { type: String, default: "", maxlength: 300, trim: true },
      officeHours: { type: String, default: "", maxlength: 200, trim: true },
    },
    social: {
      instagram: { type: String, default: "", maxlength: 300 },
      linkedin: { type: String, default: "", maxlength: 300 },
      facebook: { type: String, default: "", maxlength: 300 },
      youtube: { type: String, default: "", maxlength: 300 },
    },
    hero: {
      eyebrow: { type: String, default: "", maxlength: 80 },
      headline: { type: String, default: "", maxlength: 120 },
      subheadline: { type: String, default: "", maxlength: 300 },
      image: { type: mediaImageSchema },
      videoUrl: { type: String, default: "", maxlength: 2048 },
    },
    about: {
      story: { type: String, default: "", maxlength: 12_000 },
      values: { type: [valueSchema], default: [] },
    },
    testimonials: { type: [testimonialSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    featuredPropertyIds: { type: [Schema.Types.ObjectId], default: [] },
    announcement: { type: String, default: "", maxlength: 240, trim: true },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SiteSettingsRecord = InferSchemaType<typeof siteSettingsSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SiteSettingsModel: Model<SiteSettingsRecord> =
  (models.SiteSettings as Model<SiteSettingsRecord> | undefined) ??
  model<SiteSettingsRecord>("SiteSettings", siteSettingsSchema);
