"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import type { MediaImageInput } from "@/lib/validation/admin";
import { cn } from "@/lib/utils/cn";

export type UploadKind = "property" | "floorplan" | "agent" | "location" | "article" | "site";

const MAX_BYTES = 3.8 * 1024 * 1024;
const MAX_EDGE = 3200;

/**
 * Downscales very large camera images in the browser so uploads stay under the 4 MB request
 * limit. Already-small files are sent untouched; the server re-validates and re-encodes all.
 */
async function prepareFile(file: File): Promise<Blob> {
  if (file.size <= MAX_BYTES && !/heic|heif/i.test(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.9, 0.82, 0.74]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("This image is too large to upload. Try exporting it at a smaller size.");
}

export async function uploadImage(file: File, kind: UploadKind): Promise<MediaImageInput> {
  const body = new FormData();
  body.append("file", await prepareFile(file), file.name.replace(/\.[^.]+$/, ".jpg"));
  body.append("kind", kind);
  const response = await fetch("/api/admin/media", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as Partial<MediaImageInput> & { error?: string };
  if (!response.ok || !data.src) throw new Error(data.error ?? "Upload failed.");
  return {
    src: data.src,
    width: data.width!,
    height: data.height!,
    alt: "",
    caption: "",
    blurDataURL: data.blurDataURL ?? "",
    storageKey: data.storageKey ?? "",
  };
}

function useUploader(kind: UploadKind) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string>();
  const run = async (files: File[], onImage: (image: MediaImageInput) => void) => {
    setError(undefined);
    for (const file of files) {
      setBusy((n) => n + 1);
      try {
        onImage(await uploadImage(file, kind));
      } catch (uploadError) {
        setError(`${file.name}: ${(uploadError as Error).message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  };
  return { busy, error, run };
}

function UploadButton({
  label,
  multiple,
  onFiles,
  busy,
}: {
  label: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  busy: number;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  return (
    <label
      htmlFor={id}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-sand-300 bg-white px-3 text-sm text-ink-900 transition-colors hover:border-ink-900 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-harbour-600"
    >
      {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden strokeWidth={1.5} className="size-4" />}
      {busy ? `Uploading ${busy}…` : label}
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          if (input.current) input.current.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

export function SingleImageField({
  label,
  value,
  onChange,
  kind,
  error,
}: {
  label: string;
  value: MediaImageInput | null;
  onChange: (image: MediaImageInput | null) => void;
  kind: UploadKind;
  error?: string;
}) {
  const uploader = useUploader(kind);
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-stone-700">{label}</p>
      <div className="flex items-start gap-4">
        <div className="relative aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-sm border border-sand-200 bg-sand-100">
          {value ? <Image src={value.src} alt={value.alt} fill sizes="160px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <UploadButton label={value ? "Replace image" : "Upload image"} busy={uploader.busy} onFiles={(files) => uploader.run(files.slice(0, 1), onChange)} />
            {value ? (
              <button type="button" onClick={() => onChange(null)} className="h-9 rounded-sm px-3 text-sm text-danger-600 hover:bg-danger-50">
                Remove
              </button>
            ) : null}
          </div>
          {value ? (
            <input
              aria-label={`${label} alternative text`}
              placeholder="Describe the image (alt text)"
              value={value.alt}
              maxLength={300}
              onChange={(event) => onChange({ ...value, alt: event.target.value })}
              className="h-9 w-full rounded-sm border border-sand-300 px-3 text-sm focus:border-ink-800 focus:outline-none"
            />
          ) : null}
          {uploader.error || error ? <p role="alert" className="text-sm text-danger-600">{uploader.error ?? error}</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Ordered gallery editor: upload, reorder, choose cover, edit alt text and captions. */
export function GalleryEditor<T extends MediaImageInput>({
  images,
  onChange,
  kind,
  error,
  withLabel = false,
}: {
  images: T[];
  onChange: (images: T[]) => void;
  kind: UploadKind;
  error?: string;
  withLabel?: boolean;
}) {
  const uploader = useUploader(kind);
  // Uploads finish asynchronously; keep the newest list so concurrent results append correctly.
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };
  const patch = (index: number, value: Partial<MediaImageInput> & { label?: string }) =>
    onChange(images.map((image, i) => (i === index ? { ...image, ...value } : image)));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-600">
          {images.length} {images.length === 1 ? "image" : "images"}
          {kind === "property" ? " · the first image is the cover" : ""}
        </p>
        <UploadButton
          label="Add images"
          multiple
          busy={uploader.busy}
          onFiles={(files) =>
            uploader.run(files, (image) => {
              latest.current = [...latest.current, { ...image, ...(withLabel ? { label: "" } : {}) } as T];
              onChange(latest.current);
            })
          }
        />
      </div>
      {uploader.error || error ? (
        <p role="alert" className="mb-3 text-sm text-danger-600">
          {uploader.error ?? error}
        </p>
      ) : null}
      {images.length === 0 ? (
        <p className="rounded-sm border border-dashed border-sand-300 px-4 py-8 text-center text-sm text-stone-600">
          No images yet. Upload high-resolution photographs (JPEG, PNG, WebP or HEIC).
        </p>
      ) : (
        <ol className="space-y-2">
          {images.map((image, index) => (
            <li key={image.storageKey || image.src} className="flex gap-3 rounded-sm border border-sand-200 p-2">
              <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xs bg-sand-100">
                <Image src={image.src} alt="" fill sizes="112px" className="object-cover" />
                {index === 0 && kind === "property" ? (
                  <span className="absolute top-1 left-1 rounded-xs bg-ink-900 px-1.5 py-0.5 text-[0.6rem] text-ivory">Cover</span>
                ) : null}
              </div>
              <div className="grid min-w-0 flex-1 gap-1.5">
                {withLabel ? (
                  <input
                    aria-label={`Image ${index + 1} label`}
                    placeholder="Label, e.g. Ground floor"
                    value={(image as T & { label?: string }).label ?? ""}
                    onChange={(event) => patch(index, { label: event.target.value })}
                    className="h-8 rounded-sm border border-sand-300 px-2 text-sm focus:border-ink-800 focus:outline-none"
                  />
                ) : null}
                <input
                  aria-label={`Image ${index + 1} alternative text`}
                  placeholder="Alt text — what the photo shows"
                  value={image.alt}
                  maxLength={300}
                  onChange={(event) => patch(index, { alt: event.target.value })}
                  className="h-8 rounded-sm border border-sand-300 px-2 text-sm focus:border-ink-800 focus:outline-none"
                />
                {!withLabel ? (
                  <input
                    aria-label={`Image ${index + 1} caption`}
                    placeholder="Caption (optional)"
                    value={image.caption}
                    maxLength={300}
                    onChange={(event) => patch(index, { caption: event.target.value })}
                    className="h-8 rounded-sm border border-sand-300 px-2 text-sm focus:border-ink-800 focus:outline-none"
                  />
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label="Move down" disabled={index === images.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown className="size-4" />
                </IconButton>
                {kind === "property" ? (
                  <IconButton label="Make cover image" disabled={index === 0} onClick={() => move(index, 0)}>
                    <Star className="size-4" />
                  </IconButton>
                ) : null}
                <IconButton label="Remove image" danger onClick={() => onChange(images.filter((_, i) => i !== index))}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-xs text-stone-600 transition-colors disabled:opacity-30",
        danger ? "hover:bg-danger-50 hover:text-danger-600" : "hover:bg-sand-100 hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}
