"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-ivory">
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-20 font-sans text-ink-900">
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-stone-600 uppercase">
            Service interruption
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-tight">We will be back shortly.</h1>
          <p className="mt-5 text-lg text-stone-600">
            The site is temporarily unavailable. Please try again in a few minutes.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-10 h-12 w-fit rounded-sm bg-ink-900 px-8 text-xs font-semibold tracking-[0.12em] text-ivory uppercase"
          >
            Try again
          </button>
          {error.digest ? (
            <p className="mt-10 text-xs text-stone-500">Reference: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
