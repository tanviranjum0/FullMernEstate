import Link from "next/link";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils/cn";

export interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs({
  items,
  className,
  tone = "dark",
}: {
  items: Crumb[];
  className?: string;
  tone?: "dark" | "light";
}) {
  const all = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] font-medium tracking-[0.14em] uppercase",
            tone === "dark" ? "text-stone-600" : "text-ivory/75",
          )}
        >
          {all.map((item, index) => {
            const last = index === all.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-2">
                {last ? (
                  <span
                    aria-current="page"
                    className={tone === "dark" ? "text-ink-900" : "text-ivory"}
                  >
                    {item.label}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-current hocus:underline"
                    >
                      {item.label}
                    </Link>
                    <span aria-hidden className="opacity-50">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: `${siteConfig.url}${item.href}`,
          })),
        }}
      />
    </>
  );
}
