"use client";

import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { MediaImage } from "@/server/dto";

export function PropertyGallery({ images, title }: { images: MediaImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileTrack = useRef<HTMLDivElement>(null);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gradient-to-br from-sand-100 to-sand-200" aria-hidden />
    );
  }

  const [hero, ...rest] = images;
  const tiles = rest.slice(0, 4);

  return (
    <>
      {/* Mobile: swipeable track */}
      <div className="relative md:hidden">
        <div
          ref={mobileTrack}
          className="flex snap-x snap-mandatory scrollbar-none overflow-x-auto"
          onScroll={(event) => {
            const el = event.currentTarget;
            setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-roledescription="carousel"
          aria-label={`${title} photographs`}
        >
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openAt(i)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-sand-100"
              aria-label={`Open photo ${i + 1} of ${images.length}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                priority={i === 0}
                placeholder={image.blurDataURL ? "blur" : "empty"}
                blurDataURL={image.blurDataURL || undefined}
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <span className="tabular absolute right-4 bottom-4 rounded-xs bg-ink-950/70 px-2.5 py-1 text-xs text-ivory backdrop-blur-sm">
          {mobileIndex + 1} / {images.length}
        </span>
      </div>

      {/* Desktop: editorial mosaic */}
      <div
        className={cn(
          "relative hidden gap-2 md:grid",
          tiles.length >= 4
            ? "h-[min(72vh,44rem)] grid-cols-4 grid-rows-2"
            : tiles.length > 0
              ? "h-[min(68vh,40rem)] grid-cols-3 grid-rows-2"
              : "h-[min(72vh,44rem)]",
        )}
      >
        <button
          type="button"
          onClick={() => openAt(0)}
          className={cn(
            "group relative overflow-hidden bg-sand-100",
            tiles.length >= 4
              ? "col-span-2 row-span-2"
              : tiles.length > 0
                ? "col-span-2 row-span-2"
                : "",
          )}
          aria-label={`Open photo 1 of ${images.length}`}
        >
          <Image
            src={hero!.src}
            alt={hero!.alt}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 768px) 60vw, 100vw"
            placeholder={hero!.blurDataURL ? "blur" : "empty"}
            blurDataURL={hero!.blurDataURL || undefined}
            className="object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.03]"
          />
        </button>
        {tiles.slice(0, tiles.length >= 4 ? 4 : 2).map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => openAt(i + 1)}
            className="group relative overflow-hidden bg-sand-100"
            aria-label={`Open photo ${i + 2} of ${images.length}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 22vw, 50vw"
              className="object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.04]"
            />
          </button>
        ))}
        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute right-5 bottom-5 inline-flex h-10 items-center gap-2 rounded-sm bg-ivory/95 px-4 text-[0.7rem] font-semibold tracking-[0.14em] text-ink-900 uppercase shadow-lift backdrop-blur-sm transition-colors hover:bg-ivory"
          >
            <Grid2x2 strokeWidth={1.5} className="size-4" />
            View all {images.length} photos
          </button>
        ) : null}
      </div>

      <Lightbox
        images={images}
        title={title}
        open={open}
        onOpenChange={setOpen}
        index={index}
        onIndexChange={setIndex}
      />
    </>
  );
}

function Lightbox({
  images,
  title,
  open,
  onOpenChange,
  index,
  onIndexChange,
}: {
  images: MediaImage[];
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);

  const goTo = useCallback(
    (next: number, behavior: ScrollBehavior = "smooth") => {
      const clamped = (next + images.length) % images.length;
      onIndexChange(clamped);
      const el = track.current;
      if (el) {
        programmatic.current = true;
        el.scrollTo({ left: clamped * el.clientWidth, behavior });
        window.setTimeout(() => (programmatic.current = false), behavior === "smooth" ? 450 : 0);
      }
    },
    [images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => goTo(index, "instant"));
    return () => cancelAnimationFrame(frame);
    // Only re-centre when the lightbox opens; navigation updates index itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, goTo]);

  const current = images[index];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink-950 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex flex-col text-ivory transition-opacity duration-300 outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Dialog.Title className="truncate text-sm text-ivory/80">{title}</Dialog.Title>
            <div className="flex items-center gap-4">
              <span className="tabular text-sm text-ivory/70" aria-live="polite">
                {index + 1} / {images.length}
              </span>
              <Dialog.Close
                aria-label="Close gallery"
                className="grid size-11 place-items-center rounded-full transition-colors hover:bg-ivory/10"
              >
                <X strokeWidth={1.5} className="size-6" />
              </Dialog.Close>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={track}
              className="flex h-full snap-x snap-mandatory scrollbar-none overflow-x-auto overscroll-contain"
              onScroll={(event) => {
                if (programmatic.current) return;
                const el = event.currentTarget;
                const next = Math.round(el.scrollLeft / el.clientWidth);
                if (next !== index) onIndexChange(next);
              }}
            >
              {images.map((image, i) => (
                <figure
                  key={image.id}
                  className="relative h-full w-full shrink-0 snap-center px-2 sm:px-16"
                  aria-hidden={i !== index}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="100vw"
                      quality={80}
                      loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                      className="object-contain"
                    />
                  </div>
                </figure>
              ))}
            </div>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="Previous photo"
                  className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-ink-900/60 transition-colors hover:bg-ink-900 sm:grid"
                >
                  <ChevronLeft strokeWidth={1.5} className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Next photo"
                  className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-ink-900/60 transition-colors hover:bg-ink-900 sm:grid"
                >
                  <ChevronRight strokeWidth={1.5} className="size-6" />
                </button>
              </>
            ) : null}
          </div>

          <div className="px-4 pt-3 pb-4 sm:px-6">
            {current?.caption || current?.alt ? (
              <p className="mb-3 text-center text-sm text-ivory/70">
                {current.caption || current.alt}
              </p>
            ) : null}
            <div className="mx-auto flex max-w-4xl scrollbar-none gap-2 overflow-x-auto">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden opacity-45 transition-opacity hover:opacity-100",
                    i === index && "opacity-100 outline outline-1 outline-offset-2 outline-ivory",
                  )}
                >
                  <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
