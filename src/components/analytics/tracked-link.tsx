"use client";

import type { ComponentProps } from "react";
import { track, type TrackedEvent } from "@/lib/analytics/track";

export function TrackedAnchor({
  event,
  subject,
  onClick,
  ...props
}: ComponentProps<"a"> & { event: TrackedEvent; subject?: string }) {
  return (
    <a
      {...props}
      onClick={(clickEvent) => {
        track(event, subject);
        onClick?.(clickEvent);
      }}
    />
  );
}
