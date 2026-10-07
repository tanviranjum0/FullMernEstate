"use client";

import { useEffect } from "react";
import { useFavorites, recentlyViewedList } from "./client-stores";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { recordRecentViewAction } from "@/server/actions/account";

/** Adds the listing to "recently viewed" (device + account) and counts an anonymous view. */
export function RecordPropertyView({ propertyId }: { propertyId: string }) {
  const { ready, signedIn } = useFavorites();

  useEffect(() => {
    recentlyViewedList.add(propertyId);
  }, [propertyId]);

  useEffect(() => {
    if (ready && signedIn) void recordRecentViewAction(propertyId);
  }, [ready, signedIn, propertyId]);

  return <TrackOnMount name="property_view" subject={propertyId} />;
}
