"use client";

import { useEffect } from "react";
import { track, type TrackedEvent } from "@/lib/analytics/track";

export function TrackOnMount({ name, subject, dedupeKey }: { name: TrackedEvent; subject?: string; dedupeKey?: string }) {
  useEffect(() => {
    const key = `tdp:tracked:${name}:${dedupeKey ?? subject ?? ""}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable; track anyway */
    }
    track(name, subject);
  }, [name, subject, dedupeKey]);
  return null;
}
