"use client";

import { Heart, Scale } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { compareList, useFavorites } from "./client-stores";

export function FavoriteButton({
  propertyId,
  title,
  className,
  variant = "overlay",
}: {
  propertyId: string;
  title: string;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const { ids, toggle } = useFavorites();
  const saved = ids.has(propertyId);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(propertyId, title);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved homes` : `Save ${title}`}
      className={cn(
        "group/fav grid place-items-center transition-[background-color,color,transform] duration-300 ease-luxe active:scale-90",
        variant === "overlay"
          ? "size-10 rounded-full bg-ivory/90 text-ink-900 backdrop-blur-sm hover:bg-ivory"
          : "h-11 gap-2 rounded-sm border border-ink-900/20 px-4 text-[0.72rem] font-semibold tracking-[0.08em] uppercase hover:border-ink-900 [&]:flex",
        className,
      )}
    >
      <Heart
        strokeWidth={1.5}
        className={cn(
          "size-[18px] transition-[fill,color,transform] duration-300 ease-luxe group-hover/fav:scale-110",
          saved ? "fill-danger-600 text-danger-600" : "fill-transparent",
        )}
      />
      {variant === "inline" ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}

export function CompareButton({
  propertyId,
  title,
  className,
  variant = "overlay",
}: {
  propertyId: string;
  title: string;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const list = compareList.useList();
  const { notify } = useToast();
  const selected = list.includes(propertyId);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!selected && list.length >= compareList.max) {
          notify("Comparison is full", {
            description: `You can compare up to ${compareList.max} homes. Remove one to add another.`,
            tone: "info",
          });
          return;
        }
        compareList.toggle(propertyId);
      }}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${title} from comparison` : `Add ${title} to comparison`}
      className={cn(
        "grid place-items-center transition-colors duration-300",
        variant === "overlay"
          ? cn("size-10 rounded-full backdrop-blur-sm", selected ? "bg-ink-900 text-ivory" : "bg-ivory/90 text-ink-900 hover:bg-ivory")
          : cn(
              "h-11 gap-2 rounded-sm border px-4 text-[0.72rem] font-semibold tracking-[0.08em] uppercase [&]:flex",
              selected ? "border-ink-900 bg-ink-900 text-ivory" : "border-ink-900/20 hover:border-ink-900",
            ),
        className,
      )}
    >
      <Scale strokeWidth={1.5} className="size-[18px]" />
      {variant === "inline" ? <span>{selected ? "Comparing" : "Compare"}</span> : null}
    </button>
  );
}
