import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import {
  CONTACT_METHODS,
  INQUIRY_STATUSES,
  INQUIRY_TYPES,
  VIEWING_TIME_SLOTS,
} from "@/config/domain";

const noteSchema = new Schema(
  {
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 4_000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const inquirySchema = new Schema(
  {
    type: { type: String, enum: INQUIRY_TYPES, required: true },
    status: { type: String, enum: INQUIRY_STATUSES, default: "new", required: true },
    property: { type: Schema.Types.ObjectId, ref: "Property" },
    propertySnapshot: {
      title: { type: String, default: "" },
      slug: { type: String, default: "" },
    },
    agent: { type: Schema.Types.ObjectId, ref: "Agent" },
    user: { type: Schema.Types.ObjectId },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    preferredContact: { type: String, enum: CONTACT_METHODS, default: "email" },
    message: { type: String, default: "", maxlength: 4_000 },
    viewing: {
      date: { type: Date },
      timeSlot: { type: String, enum: [...VIEWING_TIME_SLOTS, null], default: null },
    },
    consent: { type: Boolean, required: true },
    source: {
      path: { type: String, default: "", maxlength: 500 },
      referrer: { type: String, default: "", maxlength: 500 },
      utmSource: { type: String, default: "", maxlength: 100 },
      utmMedium: { type: String, default: "", maxlength: 100 },
      utmCampaign: { type: String, default: "", maxlength: 100 },
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Agent" },
    notes: { type: [noteSchema], default: [] },
    meta: {
      ipHash: { type: String, default: "" },
      userAgent: { type: String, default: "", maxlength: 300 },
    },
    lastActivityAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
inquirySchema.index({ user: 1, createdAt: -1 });
inquirySchema.index({ email: 1, createdAt: -1 });
inquirySchema.index({ property: 1, createdAt: -1 });
inquirySchema.index({ createdAt: -1 });

export type InquiryRecord = InferSchemaType<typeof inquirySchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const InquiryModel: Model<InquiryRecord> =
  (models.Inquiry as Model<InquiryRecord> | undefined) ??
  model<InquiryRecord>("Inquiry", inquirySchema);
