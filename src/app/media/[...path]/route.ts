import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_MEDIA_ROOT } from "@/lib/media/storage";

const SEGMENT = /^[a-z0-9][a-z0-9._-]{0,120}$/i;

/**
 * Serves files written by the local (development) media driver. Every path segment is
 * validated and the resolved path must stay inside the media root, so `..` or encoded
 * separators can never escape it. In production media is served directly from Vercel Blob.
 */
export async function GET(_request: Request, context: RouteContext<"/media/[...path]">) {
  if (process.env.MEDIA_STORAGE === "blob" || process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response("Not found", { status: 404 });
  }
  const { path: segments } = await context.params;
  if (!segments.length || !segments.every((segment) => SEGMENT.test(segment) && segment !== "..")) {
    return new Response("Not found", { status: 404 });
  }
  const target = path.resolve(LOCAL_MEDIA_ROOT, ...segments);
  if (!target.startsWith(path.resolve(LOCAL_MEDIA_ROOT) + path.sep) || !target.endsWith(".webp")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(target);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
