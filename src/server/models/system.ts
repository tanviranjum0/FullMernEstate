import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    actor: {
      id: { type: String, required: true },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    action: { type: String, required: true, maxlength: 80 },
    entityType: { type: String, required: true, maxlength: 40 },
    entityId: { type: String, default: "" },
    summary: { type: String, default: "", maxlength: 500 },
    changes: { type: [String], default: [] },
    ipHash: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "audit_logs",
  },
);
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ "actor.id": 1, createdAt: -1 });

export type AuditLogRecord = InferSchemaType<typeof auditLogSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};
export const AuditLogModel: Model<AuditLogRecord> =
  (models.AuditLog as Model<AuditLogRecord> | undefined) ??
  model<AuditLogRecord>("AuditLog", auditLogSchema);

/** Fixed-window counters shared across serverless instances; expired windows are removed by TTL. */
const rateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { versionKey: false, collection: "rate_limits" },
);
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export interface RateLimitRecord {
  _id: string;
  count: number;
  resetAt: Date;
}
export const RateLimitModel: Model<RateLimitRecord> =
  (models.RateLimit as Model<RateLimitRecord> | undefined) ??
  model<RateLimitRecord>("RateLimit", rateLimitSchema);

/** Aggregated, anonymous daily counters (no personal data is stored per event). */
const dailyMetricSchema = new Schema(
  {
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    name: { type: String, required: true, maxlength: 60 },
    subject: { type: String, default: "", maxlength: 100 },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, collection: "daily_metrics" },
);
dailyMetricSchema.index({ day: 1, name: 1, subject: 1 }, { unique: true });
dailyMetricSchema.index({ name: 1, day: -1 });
dailyMetricSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type DailyMetricRecord = InferSchemaType<typeof dailyMetricSchema> & { _id: Types.ObjectId };
export const DailyMetricModel: Model<DailyMetricRecord> =
  (models.DailyMetric as Model<DailyMetricRecord> | undefined) ??
  model<DailyMetricRecord>("DailyMetric", dailyMetricSchema);
