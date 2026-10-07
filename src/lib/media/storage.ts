import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, list, put } from "@vercel/blob";
import { getServerEnv } from "@/lib/env";

export interface MediaStorage {
  /** Stores a file and returns its public URL. */
  put(pathname: string, data: Buffer, contentType: string): Promise<string>;
  /** Removes every file stored under a folder prefix. */
  deleteFolder(prefix: string): Promise<void>;
}

export const LOCAL_MEDIA_ROOT = path.join(process.cwd(), ".data", "media");

const blobStorage: MediaStorage = {
  async put(pathname, data, contentType) {
    const result = await put(pathname, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return result.url;
  },
  async deleteFolder(prefix) {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `${prefix}/`, cursor, limit: 100 });
      if (page.blobs.length) await del(page.blobs.map((blob) => blob.url));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  },
};

/** Development-only storage on local disk, served by the `/media/[...path]` route. */
const localStorage: MediaStorage = {
  async put(pathname, data) {
    const target = path.join(LOCAL_MEDIA_ROOT, ...pathname.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
    return `/media/${pathname}`;
  },
  async deleteFolder(prefix) {
    await rm(path.join(LOCAL_MEDIA_ROOT, ...prefix.split("/")), { recursive: true, force: true });
  },
};

export function getMediaStorage(): MediaStorage {
  return getServerEnv().MEDIA_STORAGE === "blob" ? blobStorage : localStorage;
}
