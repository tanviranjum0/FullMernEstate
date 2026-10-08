"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/** Route-level error boundary. Never renders error details; only a digest for support. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ui] route error", error.digest ?? "");
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col justify-center py-20">
      <p className="eyebrow text-stone-600">Something went wrong</p>
      <h1 className="mt-5 max-w-2xl font-display text-heading-1 text-ink-900">
        We could not load this page just now.
      </h1>
      <p className="mt-5 max-w-xl text-lead text-stone-600">
        Please try again in a moment. If the problem continues, our team can help.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Return home
        </ButtonLink>
      </div>
      {error.digest ? (
        <p className="mt-10 text-xs text-stone-500">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
