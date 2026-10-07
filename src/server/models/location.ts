import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { LOCATION_KINDS } from "@/config/domain";
import { faqSchema, mediaImageSchema, seoSchema } from "./shared";

const highlightSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120, trim: true },
    text: { type: String, required: true, maxlength: 600, trim: true },
  },
  { _id: true },
);

const locationSchema = new Schema(
  {
    kind: { type: String, enum: LOCATION_KINDS, required: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    parentSlug: { type: String, default: "", maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    headline: { type: String, default: "", trim: true, maxlength: 200 },
    intro: { type: String, default: "", maxlength: 1_200 },
    body: { type: String, default: "", maxlength: 20_000 },
    heroImage: { type: mediaImageSchema },
    highlights: { type: [highlightSchema], default: [] },
    lifestyle: { type: [String], default: [] },
    nearby: { type: [String], default: [] },
    marketNotes: { type: String, default: "", maxlength: 4_000 },
    faqs: { type: [faqSchema], default: [] },
    center: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    zoom: { type: Number, min: 1, max: 18, default: 12 },
    published: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 100 },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true },
);

locationSchema.index({ parentSlug: 1, slug: 1 }, { unique: true });
locationSchema.index({ kind: 1, published: 1, sortOrder: 1 });

export type LocationRecord = InferSchemaType<typeof locationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LocationModel: Model<LocationRecord> =
  (models.Location as Model<LocationRecord> | undefined) ??
  model<LocationRecord>("Location", locationSchema);
