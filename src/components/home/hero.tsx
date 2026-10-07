import Image from "next/image";
import { HeroSearch, type LocationOption } from "@/components/search/hero-search";
import { HeroCopy } from "./hero-copy";
import type { SiteSettings } from "@/server/dto";

export function HomeHero({ hero, locations }: { hero: SiteSettings["hero"]; locations: LocationOption[] }) {
  const headline = hero.headline || "Exceptional homes, thoughtfully represented";
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate -mt-[var(--header-h)] flex min-h-[100svh] flex-col bg-ink-950 text-ivory"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {hero.videoUrl ? (
          <video
            className="size-full object-cover motion-reduce:hidden"
            src={hero.videoUrl}
            poster={hero.image?.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
        ) : null}
        {hero.image ? (
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={80}
            placeholder={hero.image.blurDataURL ? "blur" : "empty"}
            blurDataURL={hero.image.blurDataURL || undefined}
            className={`animate-hero-zoom object-cover motion-reduce:animate-none ${hero.videoUrl ? "hidden motion-reduce:block" : ""}`}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(15_14_13/0.55)_0%,rgb(15_14_13/0.1)_35%,rgb(15_14_13/0.25)_60%,rgb(15_14_13/0.82)_100%)]"
        />
      </div>

      <div className="container-page flex flex-1 flex-col justify-end pt-[calc(var(--header-h)+3rem)] pb-10 sm:pb-14">
        <HeroCopy
          eyebrow={hero.eyebrow}
          headline={headline}
          subheadline={hero.subheadline}
        />
        <div className="mt-10 max-w-5xl animate-fade-up [animation-delay:700ms] sm:mt-14">
          <HeroSearch locations={locations} />
        </div>
      </div>
    </section>
  );
}
