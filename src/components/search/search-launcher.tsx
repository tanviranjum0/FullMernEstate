"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";

export interface SearchShortcut {
  label: string;
  href: string;
}

/** Keyboard-friendly search overlay: free-text search plus direct links to key destinations. */
export function SearchLauncher({ shortcuts }: { shortcuts: SearchShortcut[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    setOpen(false);
    router.push(q ? `/properties?q=${encodeURIComponent(q)}` : "/properties");
  };

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Search properties"
        className="grid size-11 place-items-center rounded-full transition-colors hover:bg-ink-900/5 group-data-[transparent]/header:hover:bg-ivory/10"
      >
        <Search strokeWidth={1.5} className="size-5" />
      </DialogTrigger>
      <DialogContent title="Search residences" className="top-[18%] w-[min(100vw-2rem,44rem)] translate-y-0">
        <form onSubmit={submit} role="search">
          <label htmlFor="global-search" className="sr-only">
            Search by neighbourhood, city or property name
          </label>
          <div className="flex items-center gap-3 border-b border-ink-900 pb-3">
            <Search aria-hidden strokeWidth={1.5} className="size-5 text-stone-600" />
            <input
              id="global-search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Gulshan penthouse, Inani villa…"
              className="min-w-0 flex-1 bg-transparent font-display text-2xl text-ink-900 placeholder:text-stone-400 focus:outline-none"
              maxLength={100}
            />
            <button
              type="submit"
              aria-label="Search"
              className="grid size-10 place-items-center rounded-full bg-ink-900 text-ivory transition-colors hover:bg-harbour-800"
            >
              <ArrowRight strokeWidth={1.5} className="size-4" />
            </button>
          </div>
        </form>
        {shortcuts.length ? (
          <div className="mt-7">
            <p className="eyebrow mb-3 text-stone-600">Explore</p>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {shortcuts.map((shortcut) => (
                <li key={shortcut.href}>
                  <Link
                    href={shortcut.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-sand-200 py-3 text-ink-800 transition-colors hover:text-harbour-700"
                  >
                    {shortcut.label}
                    <ArrowRight aria-hidden strokeWidth={1.5} className="size-4 opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </DialogRoot>
  );
}
