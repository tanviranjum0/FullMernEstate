import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { mediaImageSchema, seoSchema } from "./shared";

const agentSchema = new Schema(
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
    name: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, default: "", trim: true, maxlength: 120 },
    bio: { type: String, default: "", maxlength: 6_000 },
    photo: { type: mediaImageSchema },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    whatsapp: { type: String, default: "", trim: true, maxlength: 40 },
    languages: { type: [String], default: [] },
    specialties: { type: [String], default: [] },
    areas: { type: [String], default: [] },
    socials: {
      linkedin: { type: String, default: "", maxlength: 300 },
      instagram: { type: String, default: "", maxlength: 300 },
      website: { type: String, default: "", maxlength: 300 },
    },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
    userId: { type: String, default: "" },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true },
);

agentSchema.index({ active: 1, sortOrder: 1, name: 1 });
agentSchema.index({ userId: 1 }, { sparse: true });

export type AgentRecord = InferSchemaType<typeof agentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AgentModel: Model<AgentRecord> =
  (models.Agent as Model<AgentRecord> | undefined) ?? model<AgentRecord>("Agent", agentSchema);
