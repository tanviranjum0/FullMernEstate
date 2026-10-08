import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { USER_ROLES } from "@/config/domain";

/**
 * Read/administration view of Better Auth's `user` collection. Better Auth owns account
 * creation and credentials; this model only reads profile fields and updates the
 * application-owned `role` / `disabled` / `phone` fields.
 */
const userSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    emailVerified: { type: Boolean },
    image: { type: String },
    role: { type: String, enum: USER_ROLES, default: "user" },
    disabled: { type: Boolean, default: false },
    phone: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { collection: "user", strict: true, timestamps: false, versionKey: false, autoIndex: false },
);

export type UserRecord = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const UserModel: Model<UserRecord> =
  (models.User as Model<UserRecord> | undefined) ?? model<UserRecord>("User", userSchema);

const favoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });
favoriteSchema.index({ property: 1 });

export type FavoriteRecord = InferSchemaType<typeof favoriteSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};
export const FavoriteModel: Model<FavoriteRecord> =
  (models.Favorite as Model<FavoriteRecord> | undefined) ??
  model<FavoriteRecord>("Favorite", favoriteSchema);

const savedSearchSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    query: { type: String, required: true, maxlength: 2_000 },
    alertsEnabled: { type: Boolean, default: false },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true, collection: "saved_searches" },
);
savedSearchSchema.index({ user: 1, createdAt: -1 });
savedSearchSchema.index({ user: 1, query: 1 }, { unique: true });

export type SavedSearchRecord = InferSchemaType<typeof savedSearchSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const SavedSearchModel: Model<SavedSearchRecord> =
  (models.SavedSearch as Model<SavedSearchRecord> | undefined) ??
  model<SavedSearchRecord>("SavedSearch", savedSearchSchema);

const RECENT_VIEW_TTL_SECONDS = 60 * 60 * 24 * 90;

const recentViewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    viewedAt: { type: Date, required: true, default: () => new Date() },
  },
  { versionKey: false, collection: "recent_views" },
);
recentViewSchema.index({ user: 1, property: 1 }, { unique: true });
recentViewSchema.index({ user: 1, viewedAt: -1 });
recentViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: RECENT_VIEW_TTL_SECONDS });

export type RecentViewRecord = InferSchemaType<typeof recentViewSchema> & { _id: Types.ObjectId };
export const RecentViewModel: Model<RecentViewRecord> =
  (models.RecentView as Model<RecentViewRecord> | undefined) ??
  model<RecentViewRecord>("RecentView", recentViewSchema);
