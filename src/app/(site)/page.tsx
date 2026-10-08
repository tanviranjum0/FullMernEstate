import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/content/article-card";
import { LocationCard } from "@/components/content/location-card";
import { HomeHero } from "@/components/home/hero";
import { RecentlyViewedStrip } from "@/components/home/recently-viewed";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/motion";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section";
import { services } from "@/config/services";
import { siteConfig } from "@/config/site";
import { renderMarkdown } from "@/lib/security/markdown";
import {
  getCities,
  getFeaturedArticles,
  getLocationTree,
  getSiteSettings,
} from "@/server/queries/content";
import {
  getFeaturedProperties,
  getLatestProperties,
  getPropertyCountsByLocation,
} from "@/server/queries/properties";

export default async function HomePage() {
  const [settings, featured, latest, cities, tree, counts, articles] = await Promise.all([
    getSiteSettings(),
    getFeaturedProperties(5),
    getLatestProperties(8),
    getCities(),
    getLocationTree(),
    getPropertyCountsByLocation(),
    getFeaturedArticles(3),
  ]);

  const featuredIds = new Set(featured.map((p) => p.id));
  const fresh = latest.filter((p) => !featuredIds.has(p.id)).slice(0, 4);
  const [lead, ...supporting] = featured;
  const locationOptions = tree.map(({ city, neighbourhoods }) => ({
    city: { slug: city.slug, name: city.name },
    neighbourhoods: neighbourhoods.map((n) => ({ slug: n.slug, name: n.name })),
  }));

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.url,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${siteConfig.url}/properties?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            logo: `${siteConfig.url}/images/logo.png`,
            email: settings.contact.email || undefined,
            telephone: settings.contact.phone || undefined,
            sameAs: Object.values(settings.social).filter(Boolean),
          },
        ]}
      />
      <HomeHero hero={settings.hero} locations={locationOptions} />

      {lead ? (
        <section aria-labelledby="featured-heading" className="section-y">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                eyebrow="Signature residences"
                title={<span id="featured-heading">Homes of particular distinction</span>}
                intro="A considered selection from our current portfolio — each presented in detail, with an advisor who knows it well."
                action={
                  <ButtonLink href="/properties" variant="link">
                    View all residences <ArrowRight strokeWidth={1.5} />
                  </ButtonLink>
                }
              />
            </Reveal>
            <div className="mt-14 grid gap-x-6 gap-y-14 lg:mt-20 lg:grid-cols-12">
              <Reveal className="lg:col-span-7">
                <PropertyCard
                  property={lead}
                  priority
                  aspect="aspect-[4/5] lg:aspect-[5/6]"
                  sizes="(min-width: 1024px) 56vw, 92vw"
                />
              </Reveal>
              <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                {supporting.slice(0, 2).map((property, index) => (
                  <Reveal key={property.id} delay={0.1 * (index + 1)}>
                    <PropertyCard
                      property={property}
                      aspect="aspect-[4/3]"
                      sizes="(min-width: 1024px) 38vw, (min-width: 640px) 45vw, 92vw"
                    />
                  </Reveal>
                ))}
              </div>
            </div>
            {supporting.length > 2 ? (
              <StaggerGroup className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2">
                {supporting.slice(2).map((property) => (
                  <StaggerItem key={property.id}>
                    <PropertyCard
                      property={property}
                      aspect="aspect-[16/10]"
                      sizes="(min-width: 640px) 45vw, 92vw"
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : null}
          </div>
        </section>
      ) : null}

      <RecentlyViewedStrip />

      {cities.length ? (
        <section aria-labelledby="locations-heading" className="section-y bg-sand-100">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                eyebrow="Where we work"
                title={<span id="locations-heading">Explore by location</span>}
                intro="From Dhaka's lakeside neighbourhoods to the coast at Cox's Bazar — each guide covers homes, lifestyle and what to expect."
                action={
                  <ButtonLink href="/locations" variant="link">
                    All locations <ArrowRight strokeWidth={1.5} />
                  </ButtonLink>
                }
              />
            </Reveal>
            <StaggerGroup className="-mx-[var(--gutter)] mt-14 flex snap-x snap-mandatory scrollbar-none gap-4 overflow-x-auto px-[var(--gutter)] pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
              {cities.map((city) => (
                <StaggerItem
                  key={city.id}
                  className="w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-auto"
                >
                  <LocationCard location={city} count={counts[city.slug] ?? 0} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      ) : null}

      {fresh.length ? (
        <section aria-labelledby="latest-heading" className="section-y">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                eyebrow="New to the market"
                title={<span id="latest-heading">Recently listed</span>}
                action={
                  <ButtonLink href="/properties?sort=newest" variant="link">
                    See the latest <ArrowRight strokeWidth={1.5} />
                  </ButtonLink>
                }
              />
            </Reveal>
            <StaggerGroup className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
              {fresh.map((property) => (
                <StaggerItem key={property.id}>
                  <PropertyCard
                    property={property}
                    aspect="aspect-[4/5]"
                    sizes="(min-width: 1280px) 23vw, (min-width: 640px) 45vw, 92vw"
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="story-heading" className="bg-ink-950 text-ivory">
        <div className="container-page section-y grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionHeading
              tone="light"
              eyebrow="Our approach"
              title={<span id="story-heading">Fewer homes. More attention to each.</span>}
            />
            <ButtonLink href="/about" variant="outline-light" className="mt-10">
              About us
            </ButtonLink>
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            {settings.about.story ? (
              <Reveal>
                <div
                  className="space-y-5 text-lead text-ivory/80 [&_p+p]:mt-5"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(settings.about.story) }}
                />
              </Reveal>
            ) : null}
            {settings.about.values.length ? (
              <dl className="mt-14 grid gap-10 border-t border-ivory/15 pt-10 sm:grid-cols-3">
                {settings.about.values.map((value, index) => (
                  <Reveal key={value.id} delay={index * 0.08}>
                    <dt className="font-display text-2xl">{value.title}</dt>
                    <dd className="mt-3 text-sm leading-relaxed text-ivory/70">{value.text}</dd>
                  </Reveal>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="services-heading" className="section-y">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Services"
              title={<span id="services-heading">Advice for every stage</span>}
              action={
                <ButtonLink href="/services" variant="link">
                  All services <ArrowRight strokeWidth={1.5} />
                </ButtonLink>
              }
            />
          </Reveal>
          <ul className="mt-14 grid border-t border-sand-200 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((service, index) => (
              <Reveal
                as="li"
                key={service.slug}
                delay={index * 0.06}
                className="border-b border-sand-200 lg:border-r lg:last:border-r-0 sm:[&:nth-child(odd)]:border-r"
              >
                <Link
                  href={`/services#${service.slug}`}
                  className="group block h-full p-8 transition-colors hover:bg-sand-100"
                >
                  <span className="tabular text-xs tracking-[0.2em] text-stone-500">
                    0{index + 1}
                  </span>
                  <h3 className="mt-8 font-display text-[1.75rem] text-ink-900">{service.title}</h3>
                  <p className="mt-3 text-stone-600">{service.summary}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.16em] text-ink-900 uppercase">
                    Learn more
                    <ArrowRight
                      aria-hidden
                      strokeWidth={1.5}
                      className="size-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {articles.length ? (
        <section aria-labelledby="insights-heading" className="section-y bg-sand-100">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                eyebrow="Insights"
                title={<span id="insights-heading">Notes on living and investing well</span>}
                action={
                  <ButtonLink href="/insights" variant="link">
                    All insights <ArrowRight strokeWidth={1.5} />
                  </ButtonLink>
                }
              />
            </Reveal>
            <StaggerGroup className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-3">
              {articles.map((article) => (
                <StaggerItem key={article.id}>
                  <ArticleCard article={article} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      ) : null}

      {settings.testimonials.length ? (
        <section aria-labelledby="testimonials-heading" className="section-y">
          <div className="container-page">
            <SectionHeading
              eyebrow="Clients"
              title={<span id="testimonials-heading">In their words</span>}
              align="center"
            />
            <ul className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {settings.testimonials.map((testimonial) => (
                <li key={testimonial.id}>
                  <figure className="flex h-full flex-col border-t border-ink-900 pt-8">
                    <blockquote className="font-display text-[1.45rem] leading-snug text-ink-900">
                      “{testimonial.quote}”
                    </blockquote>
                    <figcaption className="mt-auto pt-6 text-sm text-stone-600">
                      <span className="font-semibold text-ink-900">{testimonial.author}</span>
                      {testimonial.context ? <> · {testimonial.context}</> : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="cta-heading"
        className="relative isolate overflow-hidden bg-harbour-900 text-ivory"
      >
        <div className="container-page section-y grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <SectionHeading
              tone="light"
              eyebrow="Private consultation"
              title={
                <span id="cta-heading">
                  Tell us how you want to live. We will do the searching.
                </span>
              }
              intro="Arrange a conversation with an advisor — in person, by phone or by video — with no obligation."
            />
          </Reveal>
          <Reveal className="flex flex-wrap gap-3 lg:justify-end" delay={0.1}>
            <ButtonLink href="/contact?type=consultation" variant="light" size="lg">
              Book a consultation
            </ButtonLink>
            <ButtonLink href="/contact?type=valuation" variant="outline-light" size="lg">
              Request a valuation
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
