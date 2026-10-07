import { Schema } from "mongoose";

export const mediaImageSchema = new Schema(
  {
    src: { type: String, required: true, maxlength: 2048 },
    width: { type: Number, required: true, min: 1, max: 20_000 },
    height: { type: Number, required: true, min: 1, max: 20_000 },
    alt: { type: String, default: "", maxlength: 300, trim: true },
    caption: { type: String, default: "", maxlength: 300, trim: true },
    blurDataURL: { type: String, default: "", maxlength: 6_000 },
    storageKey: { type: String, default: "", maxlength: 300 },
  },
  { _id: true },
);

export const seoSchema = new Schema(
  {
    title: { type: String, default: "", maxlength: 70, trim: true },
    description: { type: String, default: "", maxlength: 170, trim: true },
  },
  { _id: false },
);

export const faqSchema = new Schema(
  {
    question: { type: String, required: true, maxlength: 240, trim: true },
    answer: { type: String, required: true, maxlength: 2_000, trim: true },
  },
  { _id: true },
);
