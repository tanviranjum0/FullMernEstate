import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { ArrowUpRight } from "lucide-react";
import { footerNavigation, siteConfig } from "@/config/site";
import { cacheTags } from "@/server/cache-tags";
import { getCities, getSiteSettings } from "@/server/queries/content";
import { Wordmark } from "./wordmark";

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow mb-5 text-ivory/50">{title}</h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-[0.95rem] text-ivory/85 transition-colors hover:text-ivory">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.settings, cacheTags.locations);
  const [settings, cities] = await Promise.all([getSiteSettings(), getCities()]);
  const year = new Date().getFullYear();
  const socials = Object.entries(settings.social).filter(([, url]) => url);

  return (
    <footer className="bg-ink-950 text-ivory">
      <div className="container-page pt-20 pb-10 sm:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Wordmark onDark />
            <p className="mt-8 font-display text-[1.65rem] leading-snug text-ivory/90">
              Exceptional homes, thoughtfully represented.
            </p>
            <address className="mt-8 space-y-1.5 text-[0.95rem] text-ivory/70 not-italic">
              {settings.contact.address ? <p>{settings.contact.address}</p> : null}
              {settings.contact.email ? (
                <p>
                  <a href={`mailto:${settings.contact.email}`} className="transition-colors hover:text-ivory">
                    {settings.contact.email}
                  </a>
                </p>
              ) : null}
              {settings.contact.phone ? (
                <p>
                  <a href={`tel:${settings.contact.phone.replace(/\s+/g, "")}`} className="transition-colors hover:text-ivory">
                    {settings.contact.phone}
                  </a>
                </p>
              ) : null}
              {settings.contact.officeHours ? <p>{settings.contact.officeHours}</p> : null}
            </address>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <FooterColumn title="Discover" links={footerNavigation.discover} />
            <FooterColumn
              title="Locations"
              links={[...cities.map((city) => ({ href: city.href, label: city.name })), { href: "/locations", label: "All locations" }]}
            />
            <FooterColumn title="Company" links={footerNavigation.company} />
            <div>
              <h2 className="eyebrow mb-5 text-ivory/50">Your account</h2>
              <ul className="space-y-3 text-[0.95rem] text-ivory/85">
                <li>
                  <Link href="/account/saved" className="transition-colors hover:text-ivory">
                    Saved homes
                  </Link>
                </li>
                <li>
                  <Link href="/account/searches" className="transition-colors hover:text-ivory">
                    Saved searches
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="transition-colors hover:text-ivory">
                    Sign in
                  </Link>
                </li>
              </ul>
              {socials.length ? (
                <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                  {socials.map(([name, url]) => (
                    <li key={name}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs tracking-[0.16em] text-ivory/70 uppercase transition-colors hover:text-ivory"
                      >
                        {name}
                        <ArrowUpRight aria-hidden strokeWidth={1.5} className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-4 border-t border-ivory/10 pt-8 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex gap-6">
            {footerNavigation.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-ivory">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/sitemap.xml" className="transition-colors hover:text-ivory">
                Sitemap
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export async function AnnouncementBar() {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.settings);
  const { announcement } = await getSiteSettings();
  if (!announcement) return null;
  return (
    <div className="relative z-50 bg-harbour-900 px-4 py-2.5 text-center text-[0.78rem] leading-snug text-ivory/90">
      {announcement}
    </div>
  );
}
