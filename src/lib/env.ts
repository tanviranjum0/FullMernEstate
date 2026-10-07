import "server-only";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const serverEnvSchema = z
  .object({
    MONGODB_URI: z
      .string()
      .min(1, "MONGODB_URI is required (MongoDB connection string including the database name)")
      .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters (use `openssl rand -base64 48`)"),
    BETTER_AUTH_URL: z.url().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    MEDIA_STORAGE: z.enum(["blob", "local"]).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).optional(),
    LEAD_NOTIFICATION_EMAIL: z.email().optional(),
  })
  .transform((env) => ({
    ...env,
    MEDIA_STORAGE: env.MEDIA_STORAGE ?? (env.BLOB_READ_WRITE_TOKEN ? "blob" : "local"),
  }))
  .superRefine((env, ctx) => {
    if (isProduction && env.MEDIA_STORAGE === "local" && process.env.VERCEL) {
      ctx.addIssue({
        code: "custom",
        path: ["BLOB_READ_WRITE_TOKEN"],
        message:
          "Vercel deployments need Vercel Blob for media uploads (local disk is not persistent). Connect a Blob store or set BLOB_READ_WRITE_TOKEN.",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Validates server configuration on first use and fails with a precise list of what is
 * missing, rather than surfacing as an obscure driver or crypto error later.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment configuration:\n${problems}\nSee docs/ENVIRONMENT.md.`);
  }
  cached = parsed.data;
  return cached;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
