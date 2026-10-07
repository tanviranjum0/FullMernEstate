import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { ARTICLE_CATEGORY_SLUGS } from "@/config/domain";
import { mediaImageSchema, seoSchema } from "./shared";

const articleSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    excerpt: { type: String, default: "", trim: true, maxlength: 320 },
    body: { type: String, required: true, maxlength: 60_000 },
    coverImage: { type: mediaImageSchema },
    category: { type: String, enum: ARTICLE_CATEGORY_SLUGS, required: true },
    author: { type: Schema.Types.ObjectId, ref: "Agent" },
    authorName: { type: String, default: "", trim: true, maxlength: 120 },
    tags: { type: [String], default: [] },
    relatedLocationSlugs: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    featured: { type: Boolean, default: false },
    readingMinutes: { type: Number, default: 1, min: 1 },
    publishedAt: { type: Date },
    seo: { type: seoSchema, default: () => ({}) },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, category: 1, publishedAt: -1 });
articleSchema.index({ status: 1, featured: 1, publishedAt: -1 });
articleSchema.index({ status: 1, relatedLocationSlugs: 1, publishedAt: -1 });
articleSchema.index(
  { title: "text", excerpt: "text", body: "text", tags: "text" },
  { name: "article_text", weights: { title: 10, excerpt: 5, tags: 4, body: 1 } },
);

export type ArticleRecord = InferSchemaType<typeof articleSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ArticleModel: Model<ArticleRecord> =
  (models.Article as Model<ArticleRecord> | undefined) ??
  model<ArticleRecord>("Article", articleSchema);
