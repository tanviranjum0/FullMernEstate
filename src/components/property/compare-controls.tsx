"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { compareList } from "./client-stores";

/** When /compare is opened without ids, load the device's comparison list into the URL. */
export function CompareFromStorage({ hasIds }: { hasIds: boolean }) {
  const ids = compareList.useList();
  const router = useRouter();
  useEffect(() => {
    if (!hasIds && ids.length > 0) router.replace(`/compare?ids=${ids.join(",")}`);
  }, [hasIds, ids, router]);
  return null;
}

export function RemoveFromCompare({ propertyId, remainingIds, title }: { propertyId: string; remainingIds: string[]; title: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={`Remove ${title} from comparison`}
      onClick={() => {
        compareList.remove(propertyId);
        router.replace(remainingIds.length ? `/compare?ids=${remainingIds.join(",")}` : "/compare?ids=");
      }}
      className="grid size-8 place-items-center rounded-full bg-ivory/90 text-ink-900 shadow-lift transition-colors hover:bg-ivory"
    >
      <X strokeWidth={1.5} className="size-4" />
    </button>
  );
}
