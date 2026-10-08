import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/*
 * MapLibre 6 resolves its web worker relative to its own module URL, which no longer exists once
 * the library is bundled. Referencing the worker with `new URL(…, import.meta.url)` makes the
 * bundler emit it as a hashed static asset and hands us its final URL. Import MapLibre through
 * this module so the worker is always configured before a map is created.
 */
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";

export { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, type GeoJSONSource } from "maplibre-gl";
