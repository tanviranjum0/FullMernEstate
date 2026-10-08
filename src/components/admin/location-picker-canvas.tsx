"use client";

import { MAP_STYLE_URL, MapLibreMap, Marker, NavigationControl } from "@/components/maps/maplibre";
import { useEffect, useRef } from "react";

export default function LocationPickerCanvas({
  value,
  fallbackCenter,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  fallbackCenter: { lat: number; lng: number };
  onChange: (value: { lat: number; lng: number }) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container.current) return;
    const start = value ?? fallbackCenter;
    const map = new MapLibreMap({
      container: container.current,
      style: MAP_STYLE_URL,
      center: [start.lng, start.lat],
      zoom: value ? 15 : 12,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const marker = new Marker({ draggable: true, color: "#171614" });
    if (value) marker.setLngLat([value.lng, value.lat]).addTo(map);
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      onChangeRef.current({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
    });
    map.on("click", (event) => {
      marker.setLngLat(event.lngLat).addTo(map);
      onChangeRef.current({
        lat: Number(event.lngLat.lat.toFixed(6)),
        lng: Number(event.lngLat.lng.toFixed(6)),
      });
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; value changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !value) return;
    marker.setLngLat([value.lng, value.lat]).addTo(map);
  }, [value]);

  useEffect(() => {
    if (!value)
      mapRef.current?.flyTo({ center: [fallbackCenter.lng, fallbackCenter.lat], zoom: 13 });
    // Re-centre only when the chosen area changes and no pin has been placed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackCenter.lat, fallbackCenter.lng]);

  return (
    <div
      ref={container}
      className="h-full w-full"
      role="application"
      aria-label="Click the map to place the listing's location"
    />
  );
}
