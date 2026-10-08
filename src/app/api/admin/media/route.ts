import { randomUUID } from "node:crypto";
import { siteConfig } from "@/config/site";
import { authorize } from "@/lib/auth/session";
import { ImageValidationError, MAX_UPLOAD_BYTES, processImage } from "@/lib/media/process";
import { getMediaStorage } from "@/lib/media/storage";
import { variantFileName } from "@/lib/media/variants";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { recordAudit } from "@/server/services/audit";

const KINDS = new Set(["property", "floorplan", "agent", "location", "article", "site"]);

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([new URL(siteConfig.url).origin, new URL(request.url).origin]);
  return allowed.has(origin);
}

/**
 * Accepts one image per request from authorised staff. The file is validated by decoding,
 * re-encoded to WebP variants with all metadata stripped, and stored under a random folder.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });

  const auth = await authorize("media:upload");
  if (!auth.ok) {
    return Response.json({ error: "Not allowed" }, { status: auth.reason === "unauthenticated" ? 401 : 403 });
  }

  const limit = await consumeRateLimit(`upload:${auth.user.id}`, RATE_LIMITS.upload);
  if (!limit.allowed) return Response.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return Response.json({ error: "Images must be smaller than 4 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "property");
  if (!(file instanceof File) || !KINDS.has(kind)) return Response.json({ error: "Invalid upload." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "Images must be smaller than 4 MB." }, { status: 413 });
  }

  try {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()));
    const folder = `${kind}/${randomUUID()}`;
    const storage = getMediaStorage();
    let src = "";
    for (const variant of processed.variants) {
      src = await storage.put(`${folder}/${variantFileName(variant.width)}`, variant.buffer, "image/webp");
    }
    await recordAudit(auth.user, "media.uploaded", "media", folder, `Uploaded ${kind} image (${processed.width}×${processed.height})`);
    return Response.json({
      src,
      width: processed.width,
      height: processed.height,
      blurDataURL: processed.blurDataURL,
      storageKey: folder,
      alt: "",
      caption: "",
    });
  } catch (error) {
    if (error instanceof ImageValidationError) return Response.json({ error: error.message }, { status: 422 });
    console.error("[media] upload failed", { error: (error as Error).message });
    return Response.json({ error: "The image could not be processed." }, { status: 500 });
  }
}
