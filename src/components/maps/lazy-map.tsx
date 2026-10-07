"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MapCanvasProps } from "./map-canvas";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => <MapPlaceholder label="Loading map…" />,
});

function MapPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-sand-100 text-sm text-stone-600">
      <MapPin aria-hidden strokeWidth={1.25} className="mr-2 size-4" />
      {label}
    </div>
  );
}

/**
 * Defers downloading MapLibre until the map scrolls near the viewport, so pages that merely
 * contain a map further down do not pay for it up front.
 */
export function LazyMap({ className, eager = false, ...props }: MapCanvasProps & { eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? <MapCanvas {...props} className="h-full w-full" /> : <MapPlaceholder label="Map" />}
    </div>
  );
}
