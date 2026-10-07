import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import {
  AMENITY_KEYS,
  AVAILABILITY_STATUSES,
  FURNISHING_OPTIONS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  PUBLICATION_STATUSES,
  SUPPORTED_CURRENCIES,
  VIRTUAL_TOUR_KINDS,
} from "@/config/property-options";
import { mediaImageSchema, seoSchema } from "./shared";

const floorPlanSchema = new Schema(
  {
    src: { type: String, required: true, maxlength: 2048 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    label: { type: String, default: "", maxlength: 120, trim: true },
    blurDataURL: { type: String, default: "", maxlength: 6_000 },
    storageKey: { type: String, default: "", maxlength: 300 },
  },
  { _id: true },
);

const propertySchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    headline: { type: String, default: "", trim: true, maxlength: 220 },
    description: { type: String, required: true, maxlength: 12_000 },
    status: { type: String, enum: PUBLICATION_STATUSES, default: "draft", required: true },
    listingType: { type: String, enum: LISTING_TYPES, required: true },
    propertyType: { type: String, enum: PROPERTY_TYPES, required: true },
    availability: { type: String, enum: AVAILABILITY_STATUSES, default: "available", required: true },
    price: {
      amount: { type: Number, required: true, min: 0, max: 1e13 },
      currency: { type: String, enum: SUPPORTED_CURRENCIES, required: true, default: "BDT" },
      previousAmount: { type: Number, min: 0, max: 1e13 },
      onRequest: { type: Boolean, default: false },
    },
    specs: {
      bedrooms: { type: Number, min: 0, max: 50, default: 0 },
      bathrooms: { type: Number, min: 0, max: 50, default: 0 },
      areaSqft: { type: Number, min: 0, max: 5_000_000 },
      landAreaSqft: { type: Number, min: 0, max: 50_000_000 },
      parkingSpaces: { type: Number, min: 0, max: 50, default: 0 },
      yearBuilt: { type: Number, min: 1800, max: 2100 },
      floors: { type: Number, min: 0, max: 200 },
      floorLevel: { type: Number, min: -5, max: 200 },
      furnishing: { type: String, enum: FURNISHING_OPTIONS },
    },
    amenities: { type: [{ type: String, enum: AMENITY_KEYS }], default: [] },
    flags: {
      featured: { type: Boolean, default: false },
      exclusive: { type: Boolean, default: false },
      newConstruction: { type: Boolean, default: false },
    },
    location: {
      citySlug: { type: String, required: true, maxlength: 100 },
      cityName: { type: String, required: true, maxlength: 120 },
      neighbourhoodSlug: { type: String, default: "", maxlength: 100 },
      neighbourhoodName: { type: String, default: "", maxlength: 120 },
      displayAddress: { type: String, default: "", maxlength: 200, trim: true },
      addressLine: { type: String, default: "", maxlength: 300, trim: true },
      showExactLocation: { type: Boolean, default: false },
      geo: {
        type: { type: String, enum: ["Point"] },
        coordinates: { type: [Number], default: undefined },
      },
    },
    images: { type: [mediaImageSchema], default: [] },
    floorPlans: { type: [floorPlanSchema], default: [] },
    video: { url: { type: String, default: "", maxlength: 2048 } },
    virtualTour: {
      url: { type: String, default: "", maxlength: 2048 },
      kind: { type: String, enum: VIRTUAL_TOUR_KINDS, default: "tour360" },
    },
    agent: { type: Schema.Types.ObjectId, ref: "Agent" },
    seo: { type: seoSchema, default: () => ({}) },
    publishedAt: { type: Date },
    priceChangedAt: { type: Date },
    viewCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    legacy: {
      listingId: { type: String },
      ownerId: { type: String },
    },
  },
  // Default minimize keeps an empty `location.geo` from being stored, which the 2dsphere index rejects.
  { timestamps: true },
);

propertySchema.index({ status: 1, listingType: 1, publishedAt: -1 });
propertySchema.index({ status: 1, listingType: 1, "price.amount": 1 });
propertySchema.index({ status: 1, "location.citySlug": 1, "location.neighbourhoodSlug": 1, publishedAt: -1 });
propertySchema.index({ status: 1, "flags.featured": 1, publishedAt: -1 });
propertySchema.index({ status: 1, propertyType: 1, publishedAt: -1 });
propertySchema.index({ status: 1, "specs.areaSqft": -1 });
propertySchema.index({ status: 1, amenities: 1 });
propertySchema.index({ agent: 1, status: 1, updatedAt: -1 });
propertySchema.index({ updatedAt: -1 });
propertySchema.index({ "location.geo": "2dsphere" });
propertySchema.index({ "legacy.listingId": 1 }, { sparse: true });
propertySchema.index(
  {
    title: "text",
    headline: "text",
    "location.cityName": "text",
    "location.neighbourhoodName": "text",
    "location.displayAddress": "text",
    description: "text",
  },
  {
    name: "property_text",
    weights: {
      title: 10,
      "location.neighbourhoodName": 8,
      "location.cityName": 6,
      headline: 5,
      "location.displayAddress": 4,
      description: 1,
    },
  },
);

export type PropertyRecord = InferSchemaType<typeof propertySchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PropertyModel: Model<PropertyRecord> =
  (models.Property as Model<PropertyRecord> | undefined) ??
  model<PropertyRecord>("Property", propertySchema);
