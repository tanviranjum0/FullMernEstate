"use client";

import {
  LngLatBounds,
  MAP_STYLE_URL,
  MapLibreMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
} from "./maplibre";
import { useEffect, useRef } from "react";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
}

export interface MapCanvasProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  cluster?: boolean;
  approximateRadiusMeters?: number;
  highlightedId?: string | null;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  ariaLabel: string;
  className?: string;
}

const INK = "#171614";

function circlePolygon(lat: number, lng: number, radiusMeters: number, steps = 64) {
  const coordinates: [number, number][] = [];
  const latRadius = radiusMeters / 111_320;
  const lngRadius = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    coordinates.push([lng + lngRadius * Math.cos(angle), lat + latRadius * Math.sin(angle)]);
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coordinates] },
  };
}

function markerElement(
  marker: MapMarker,
  onClick?: (id: string) => void,
  onHover?: (id: string | null) => void,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tdp-map-marker";
  button.textContent = marker.label;
  button.setAttribute("aria-label", `${marker.title}, ${marker.label}`);
  button.dataset.id = marker.id;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick?.(marker.id);
  });
  button.addEventListener("mouseenter", () => onHover?.(marker.id));
  button.addEventListener("mouseleave", () => onHover?.(null));
  button.addEventListener("focus", () => onHover?.(marker.id));
  button.addEventListener("blur", () => onHover?.(null));
  return button;
}

/**
 * MapLibre canvas with clustered results. Individual homes render as real <button> elements
 * (keyboard focusable, labelled); clusters stay on the canvas and expand on click.
 */
export default function MapCanvas({
  markers,
  center,
  zoom = 12,
  cluster = true,
  approximateRadiusMeters,
  highlightedId,
  onMarkerClick,
  onMarkerHover,
  ariaLabel,
  className,
}: MapCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef(new Map<string, Marker>());
  const handlers = useRef({ onMarkerClick, onMarkerHover });
  useEffect(() => {
    handlers.current = { onMarkerClick, onMarkerHover };
  }, [onMarkerClick, onMarkerHover]);

  useEffect(() => {
    if (!container.current) return;
    const first = markers[0];
    const map = new MapLibreMap({
      container: container.current,
      style: MAP_STYLE_URL,
      center: center
        ? [center.lng, center.lat]
        : first
          ? [first.lng, first.lat]
          : [90.4125, 23.8103],
      zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    const markerStore = markerRefs.current;

    const byId = new Map(markers.map((marker) => [marker.id, marker]));
    const syncMarkers = () => {
      const visible = new Set<string>();
      if (cluster) {
        const features = map.querySourceFeatures("homes", {
          filter: ["!", ["has", "point_count"]],
        });
        for (const feature of features) visible.add(String(feature.properties?.id));
      } else {
        for (const marker of markers) visible.add(marker.id);
      }
      for (const [id, marker] of markerStore) {
        if (!visible.has(id)) {
          marker.remove();
          markerStore.delete(id);
        }
      }
      for (const id of visible) {
        if (markerStore.has(id)) continue;
        const data = byId.get(id);
        if (!data) continue;
        const element = markerElement(
          data,
          (clicked) => handlers.current.onMarkerClick?.(clicked),
          (hovered) => handlers.current.onMarkerHover?.(hovered),
        );
        markerStore.set(id, new Marker({ element }).setLngLat([data.lng, data.lat]).addTo(map));
      }
    };

    map.on("load", () => {
      if (approximateRadiusMeters && first) {
        map.addSource("area", {
          type: "geojson",
          data: circlePolygon(first.lat, first.lng, approximateRadiusMeters),
        });
        map.addLayer({
          id: "area-fill",
          type: "fill",
          source: "area",
          paint: { "fill-color": "#3e5170", "fill-opacity": 0.14 },
        });
        map.addLayer({
          id: "area-line",
          type: "line",
          source: "area",
          paint: { "line-color": "#2f405a", "line-width": 1.5, "line-dasharray": [2, 2] },
        });
        return;
      }

      map.addSource("homes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: markers.map((marker) => ({
            type: "Feature",
            properties: { id: marker.id },
            geometry: { type: "Point", coordinates: [marker.lng, marker.lat] },
          })),
        },
        cluster,
        clusterRadius: 48,
        clusterMaxZoom: 15,
      });

      if (cluster) {
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "homes",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": INK,
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#f7f4ef",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "homes",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Noto Sans Bold"],
            "text-size": 13,
          },
          paint: { "text-color": "#f7f4ef" },
        });
        map.on("click", "clusters", async (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const source = map.getSource("homes") as GeoJSONSource;
          const expansion = await source.getClusterExpansionZoom(
            feature.properties?.cluster_id as number,
          );
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: expansion,
          });
        });
        map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
        map.on("sourcedata", (event) => {
          if (event.sourceId === "homes" && event.isSourceLoaded) syncMarkers();
        });
        map.on("moveend", syncMarkers);
      } else {
        syncMarkers();
      }

      if (!center && markers.length > 1) {
        const bounds = new LngLatBounds();
        for (const marker of markers) bounds.extend([marker.lng, marker.lat]);
        map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 0 });
      }
    });

    return () => {
      for (const marker of markerStore.values()) marker.remove();
      markerStore.clear();
      map.remove();
      mapRef.current = null;
    };
    // The map is rebuilt when its data set changes; highlight changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, cluster, approximateRadiusMeters]);

  useEffect(() => {
    for (const [id, marker] of markerRefs.current) {
      marker.getElement().toggleAttribute("data-active", id === highlightedId);
    }
  }, [highlightedId]);

  return <div ref={container} role="region" aria-label={ariaLabel} className={className} />;
}
