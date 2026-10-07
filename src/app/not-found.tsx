import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <header className="container-page flex h-[var(--header-h)] items-center">
        <Wordmark />
      </header>
      <main id="main" className="container-page flex flex-1 flex-col justify-center py-20">
        <p className="eyebrow text-stone-600">Error 404</p>
        <h1 className="mt-5 max-w-3xl font-display text-display-2 text-ink-900">This address is no longer on our books.</h1>
        <p className="mt-6 max-w-xl text-lead text-stone-600">
          The page may have moved, or the residence may have been sold or withdrawn. These might help:
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/properties">Browse residences</ButtonLink>
          <ButtonLink href="/locations" variant="outline">
            Explore locations
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Contact us
          </ButtonLink>
        </div>
        <p className="mt-16 text-sm text-stone-600">
          Or return to the <Link href="/" className="underline underline-offset-4 hover:text-ink-900">home page</Link>.
        </p>
      </main>
    </div>
  );
}
