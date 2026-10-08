"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, type PropertyType } from "@/config/property-options";
import { searchHref } from "@/lib/search/params";
import { cn } from "@/lib/utils/cn";

export interface LocationOption {
  city: { slug: string; name: string };
  neighbourhoods: { slug: string; name: string }[];
}

type Mode = "sale" | "rent" | "map";

const BUDGETS: Record<"sale" | "rent", { label: string; min?: number; max?: number }[]> = {
  sale: [
    { label: "Up to BDT 5 Crore", max: 50_000_000 },
    { label: "BDT 5–10 Crore", min: 50_000_000, max: 100_000_000 },
    { label: "BDT 10–20 Crore", min: 100_000_000, max: 200_000_000 },
    { label: "Over BDT 20 Crore", min: 200_000_000 },
  ],
  rent: [
    { label: "Up to BDT 2 Lakh / month", max: 200_000 },
    { label: "BDT 2–5 Lakh / month", min: 200_000, max: 500_000 },
    { label: "BDT 5–10 Lakh / month", min: 500_000, max: 1_000_000 },
    { label: "Over BDT 10 Lakh / month", min: 1_000_000 },
  ],
};

const fieldClass =
  "h-12 w-full appearance-none bg-transparent pr-6 text-[0.95rem] text-ink-900 focus:outline-none cursor-pointer";

export function HeroSearch({ locations }: { locations: LocationOption[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sale");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<PropertyType | "">("");
  const [budget, setBudget] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const [city, neighbourhood] = location ? location.split("/") : [];
    const budgetOption = mode === "map" ? undefined : BUDGETS[mode][Number(budget)];
    const query = {
      listing: mode === "map" ? undefined : mode,
      city,
      neighbourhood,
      types: type ? [type] : [],
      minPrice: budget !== "" ? budgetOption?.min : undefined,
      maxPrice: budget !== "" ? budgetOption?.max : undefined,
    };
    router.push(searchHref(query, mode === "map" ? "/properties/map" : "/properties"));
  };

  const tabs: { value: Mode; label: string }[] = [
    { value: "sale", label: "Buy" },
    { value: "rent", label: "Rent" },
    { value: "map", label: "Explore map" },
  ];

  return (
    <form onSubmit={submit} role="search" aria-label="Find a residence" className="w-full">
      <div role="radiogroup" aria-label="Search for" className="mb-3 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="radio"
            aria-checked={mode === tab.value}
            onClick={() => {
              setMode(tab.value);
              setBudget("");
            }}
            className={cn(
              "rounded-xs px-4 py-2 text-[0.7rem] font-semibold tracking-[0.16em] uppercase transition-colors duration-300",
              mode === tab.value
                ? "bg-ivory text-ink-900"
                : "text-ivory/80 hover:bg-ivory/10 hover:text-ivory",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="grid gap-px overflow-hidden rounded-sm bg-sand-200 shadow-float md:grid-cols-[1.3fr_1fr_1fr_auto]">
        <div className="bg-paper px-5 pt-3">
          <label htmlFor="hero-location" className="eyebrow block text-stone-600">
            Location
          </label>
          <select
            id="hero-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={fieldClass}
          >
            <option value="">All locations</option>
            {locations.map((group) => (
              <optgroup key={group.city.slug} label={group.city.name}>
                <option value={group.city.slug}>All of {group.city.name}</option>
                {group.neighbourhoods.map((n) => (
                  <option key={n.slug} value={`${group.city.slug}/${n.slug}`}>
                    {n.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="bg-paper px-5 pt-3">
          <label htmlFor="hero-type" className="eyebrow block text-stone-600">
            Property type
          </label>
          <select
            id="hero-type"
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType | "")}
            className={fieldClass}
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.filter((t) => t !== "commercial" && t !== "land").map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-paper px-5 pt-3">
          <label htmlFor="hero-budget" className="eyebrow block text-stone-600">
            Budget
          </label>
          <select
            id="hero-budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={mode === "map"}
            className={cn(fieldClass, "disabled:cursor-not-allowed disabled:text-stone-500")}
          >
            <option value="">Any budget</option>
            {mode !== "map"
              ? BUDGETS[mode].map((option, index) => (
                  <option key={option.label} value={index}>
                    {option.label}
                  </option>
                ))
              : null}
          </select>
        </div>
        <button
          type="submit"
          className="flex h-16 items-center justify-center gap-3 bg-ink-900 px-8 text-[0.72rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors duration-300 hover:bg-harbour-800 md:h-auto"
        >
          {mode === "map" ? "Open map" : "Search"}
          <ArrowRight aria-hidden strokeWidth={1.5} className="size-4" />
        </button>
      </div>
    </form>
  );
}
