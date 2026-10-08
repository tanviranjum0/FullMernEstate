"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { LayoutGrid, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { SheetContent, SheetRoot, SheetTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form-controls";
import {
  AMENITY_LABELS,
  AREA_STEPS,
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  FURNISHING_LABELS,
  FURNISHING_OPTIONS,
  LISTING_FLAG_LABELS,
  LISTING_FLAGS,
  PRICE_STEPS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  SEARCH_FEATURE_FILTERS,
  SORT_OPTIONS,
  type AmenityKey,
  type ListingFlag,
  type PropertyType,
  type SortOption,
} from "@/config/property-options";
import { siteConfig } from "@/config/site";
import { formatNumber, formatPrice } from "@/lib/format";
import { countActiveFilters, searchHref, type PropertySearchQuery } from "@/lib/search/params";
import { cn } from "@/lib/utils/cn";
import type { LocationOption } from "./hero-search";

interface Props {
  query: PropertySearchQuery;
  locations: LocationOption[];
  basePath?: string;
  view?: "grid" | "map";
}

const compactSelect =
  "h-11 cursor-pointer appearance-none rounded-sm border border-sand-300 bg-paper bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23645e56%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9 pl-3.5 text-sm text-ink-900 transition-colors hover:border-stone-400 focus:border-ink-800 focus:outline-none focus:ring-2 focus:ring-harbour-200";

function priceLabel(amount: number, listing: "sale" | "rent") {
  return formatPrice(amount, siteConfig.defaultCurrency, {
    compact: true,
    period: listing === "rent" ? "month" : null,
  });
}

function withoutPage(
  query: PropertySearchQuery,
  patch: Partial<PropertySearchQuery>,
): PropertySearchQuery {
  return { ...query, ...patch, page: 1 };
}

export function SearchControls({
  query,
  locations,
  basePath = "/properties",
  view = "grid",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (next: PropertySearchQuery) =>
    startTransition(() => router.push(searchHref(next, basePath), { scroll: false }));
  const apply = (patch: Partial<PropertySearchQuery>) => navigate(withoutPage(query, patch));

  const listing = query.listing ?? "sale";
  const priceSteps = PRICE_STEPS[listing];
  const location = query.city
    ? query.neighbourhood
      ? `${query.city}/${query.neighbourhood}`
      : query.city
    : "";
  const activeCount = countActiveFilters(query);

  return (
    <div data-pending={pending || undefined} className="group/search">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-harbour-600 transition-transform duration-[1200ms] ease-calm group-data-[pending]/search:scale-x-90"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Listing type"
          className="flex rounded-sm border border-sand-300 bg-paper p-1"
        >
          {[
            { value: undefined, label: "All" },
            { value: "sale" as const, label: "Buy" },
            { value: "rent" as const, label: "Rent" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={query.listing === option.value}
              onClick={() =>
                apply({ listing: option.value, minPrice: undefined, maxPrice: undefined })
              }
              className={cn(
                "h-9 rounded-xs px-4 text-[0.7rem] font-semibold tracking-[0.14em] uppercase transition-colors",
                query.listing === option.value
                  ? "bg-ink-900 text-ivory"
                  : "text-stone-700 hover:text-ink-900",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="filter-location">
          Location
        </label>
        <select
          id="filter-location"
          className={cn(compactSelect, "hidden md:block")}
          value={location}
          onChange={(event) => {
            const [city, neighbourhood] = event.target.value ? event.target.value.split("/") : [];
            apply({ city, neighbourhood });
          }}
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

        <label className="sr-only" htmlFor="filter-type">
          Property type
        </label>
        <select
          id="filter-type"
          className={cn(compactSelect, "hidden lg:block")}
          value={
            query.types.length === 1 ? query.types[0] : query.types.length > 1 ? "__multi" : ""
          }
          onChange={(event) =>
            apply({ types: event.target.value ? [event.target.value as PropertyType] : [] })
          }
        >
          <option value="">Any type</option>
          {query.types.length > 1 ? (
            <option value="__multi">{query.types.length} types</option>
          ) : null}
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-max-price">
          Maximum price
        </label>
        <select
          id="filter-max-price"
          className={cn(compactSelect, "hidden lg:block")}
          value={query.maxPrice ?? ""}
          onChange={(event) =>
            apply({ maxPrice: event.target.value ? Number(event.target.value) : undefined })
          }
        >
          <option value="">Any price</option>
          {priceSteps.map((step) => (
            <option key={step} value={step}>
              Up to {priceLabel(step, listing)}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-beds">
          Bedrooms
        </label>
        <select
          id="filter-beds"
          className={cn(compactSelect, "hidden xl:block")}
          value={query.beds ?? ""}
          onChange={(event) =>
            apply({ beds: event.target.value ? Number(event.target.value) : undefined })
          }
        >
          <option value="">Any beds</option>
          {[1, 2, 3, 4, 5, 6].map((beds) => (
            <option key={beds} value={beds}>
              {beds}+ beds
            </option>
          ))}
        </select>

        <FiltersSheet
          query={query}
          locations={locations}
          onApply={navigate}
          trigger={
            <span className="flex items-center gap-2">
              <SlidersHorizontal strokeWidth={1.5} className="size-4" />
              <span className="hidden sm:inline">More filters</span>
              <span className="sm:hidden">Filters</span>
              {activeCount > 0 ? (
                <span className="tabular grid size-5 place-items-center rounded-full bg-ink-900 text-[0.65rem] text-ivory">
                  {activeCount}
                </span>
              ) : null}
            </span>
          }
        />

        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-sort">
            Sort by
          </label>
          <select
            id="filter-sort"
            className={compactSelect}
            value={query.sort}
            onChange={(event) => apply({ sort: event.target.value as SortOption })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "newest" && query.q ? "Best match" : option.label}
              </option>
            ))}
          </select>
          <div
            className="hidden rounded-sm border border-sand-300 bg-paper p-1 sm:flex"
            aria-label="View"
          >
            <Link
              href={searchHref(query, "/properties")}
              aria-label="Grid view"
              aria-current={view === "grid" ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-xs transition-colors",
                view === "grid" ? "bg-ink-900 text-ivory" : "text-stone-600 hover:text-ink-900",
              )}
            >
              <LayoutGrid strokeWidth={1.5} className="size-4" />
            </Link>
            <Link
              href={searchHref({ ...query, page: 1 }, "/properties/map")}
              aria-label="Map view"
              aria-current={view === "map" ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-xs transition-colors",
                view === "map" ? "bg-ink-900 text-ivory" : "text-stone-600 hover:text-ink-900",
              )}
            >
              <MapIcon strokeWidth={1.5} className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiltersSheet({
  query,
  locations,
  onApply,
  trigger,
}: {
  query: PropertySearchQuery;
  locations: LocationOption[];
  onApply: (query: PropertySearchQuery) => void;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  const update = (patch: Partial<PropertySearchQuery>) =>
    setDraft((current) => ({ ...current, ...patch, page: 1 }));
  const listing = draft.listing ?? "sale";
  const location = draft.city
    ? draft.neighbourhood
      ? `${draft.city}/${draft.neighbourhood}`
      : draft.city
    : "";

  const toggleIn = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  return (
    <SheetRoot
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(query);
        setOpen(next);
      }}
    >
      <SheetTrigger className="flex h-11 items-center rounded-sm border border-sand-300 bg-paper px-4 text-sm text-ink-900 transition-colors hover:border-stone-400">
        {trigger}
      </SheetTrigger>
      <SheetContent
        side="right"
        title="Refine your search"
        className="md:w-[30rem]"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() =>
                setDraft({
                  ...query,
                  listing: undefined,
                  types: [],
                  city: undefined,
                  neighbourhood: undefined,
                  minPrice: undefined,
                  maxPrice: undefined,
                  beds: undefined,
                  baths: undefined,
                  minArea: undefined,
                  maxArea: undefined,
                  features: [],
                  furnishing: undefined,
                  parking: false,
                  availability: undefined,
                  flags: [],
                  page: 1,
                })
              }
            >
              Clear all
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onApply(draft);
              }}
            >
              Show results
            </Button>
          </div>
        }
      >
        <div className="space-y-9">
          <FilterGroup legend="Looking to">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: undefined, label: "Any" },
                { value: "sale" as const, label: "Buy" },
                { value: "rent" as const, label: "Rent" },
              ].map((option) => (
                <ChoiceChip
                  key={option.label}
                  selected={draft.listing === option.value}
                  onClick={() =>
                    update({ listing: option.value, minPrice: undefined, maxPrice: undefined })
                  }
                >
                  {option.label}
                </ChoiceChip>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup legend="Location">
            <select
              aria-label="Location"
              className={cn(compactSelect, "w-full")}
              value={location}
              onChange={(event) => {
                const [city, neighbourhood] = event.target.value
                  ? event.target.value.split("/")
                  : [];
                update({ city, neighbourhood });
              }}
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
          </FilterGroup>

          <FilterGroup legend="Property type">
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <ChoiceChip
                  key={type}
                  selected={draft.types.includes(type)}
                  onClick={() => update({ types: toggleIn(draft.types, type) })}
                >
                  {PROPERTY_TYPE_LABELS[type]}
                </ChoiceChip>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup legend={`Price${listing === "rent" ? " per month" : ""}`}>
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Minimum price"
                className={cn(compactSelect, "w-full")}
                value={draft.minPrice ?? ""}
                onChange={(event) =>
                  update({ minPrice: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">No minimum</option>
                {PRICE_STEPS[listing].map((step) => (
                  <option key={step} value={step}>
                    {priceLabel(step, listing)}
                  </option>
                ))}
              </select>
              <select
                aria-label="Maximum price"
                className={cn(compactSelect, "w-full")}
                value={draft.maxPrice ?? ""}
                onChange={(event) =>
                  update({ maxPrice: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">No maximum</option>
                {PRICE_STEPS[listing].map((step) => (
                  <option key={step} value={step}>
                    {priceLabel(step, listing)}
                  </option>
                ))}
              </select>
            </div>
          </FilterGroup>

          <div className="grid grid-cols-2 gap-6">
            <FilterGroup legend="Bedrooms">
              <select
                aria-label="Minimum bedrooms"
                className={cn(compactSelect, "w-full")}
                value={draft.beds ?? ""}
                onChange={(event) =>
                  update({ beds: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterGroup legend="Bathrooms">
              <select
                aria-label="Minimum bathrooms"
                className={cn(compactSelect, "w-full")}
                value={draft.baths ?? ""}
                onChange={(event) =>
                  update({ baths: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </FilterGroup>
          </div>

          <FilterGroup legend={`Interior area (${siteConfig.areaUnit})`}>
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Minimum area"
                className={cn(compactSelect, "w-full")}
                value={draft.minArea ?? ""}
                onChange={(event) =>
                  update({ minArea: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">No minimum</option>
                {AREA_STEPS.map((step) => (
                  <option key={step} value={step}>
                    {formatNumber(step)}
                  </option>
                ))}
              </select>
              <select
                aria-label="Maximum area"
                className={cn(compactSelect, "w-full")}
                value={draft.maxArea ?? ""}
                onChange={(event) =>
                  update({ maxArea: event.target.value ? Number(event.target.value) : undefined })
                }
              >
                <option value="">No maximum</option>
                {AREA_STEPS.map((step) => (
                  <option key={step} value={step}>
                    {formatNumber(step)}
                  </option>
                ))}
              </select>
            </div>
          </FilterGroup>

          <FilterGroup legend="Features">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {SEARCH_FEATURE_FILTERS.map((feature) => (
                <CheckRow
                  key={feature}
                  label={AMENITY_LABELS[feature]}
                  checked={draft.features.includes(feature)}
                  onChange={() =>
                    update({ features: toggleIn<AmenityKey>(draft.features, feature) })
                  }
                />
              ))}
              <CheckRow
                label="Parking"
                checked={draft.parking}
                onChange={() => update({ parking: !draft.parking })}
              />
            </div>
          </FilterGroup>

          <FilterGroup legend="Furnishing">
            <div className="grid grid-cols-2 gap-2">
              <ChoiceChip
                selected={!draft.furnishing}
                onClick={() => update({ furnishing: undefined })}
              >
                Any
              </ChoiceChip>
              {FURNISHING_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option}
                  selected={draft.furnishing === option}
                  onClick={() => update({ furnishing: option })}
                >
                  {FURNISHING_LABELS[option]}
                </ChoiceChip>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup legend="Listing">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {LISTING_FLAGS.map((flag) => (
                <CheckRow
                  key={flag}
                  label={LISTING_FLAG_LABELS[flag]}
                  checked={draft.flags.includes(flag)}
                  onChange={() => update({ flags: toggleIn<ListingFlag>(draft.flags, flag) })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup legend="Availability">
            <select
              aria-label="Availability"
              className={cn(compactSelect, "w-full")}
              value={draft.availability ?? ""}
              onChange={(event) =>
                update({
                  availability: (event.target.value ||
                    undefined) as PropertySearchQuery["availability"],
                })
              }
            >
              <option value="">Any status</option>
              {AVAILABILITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {AVAILABILITY_LABELS[status]}
                </option>
              ))}
            </select>
          </FilterGroup>
        </div>
      </SheetContent>
    </SheetRoot>
  );
}

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3 text-stone-700">{legend}</legend>
      {children}
    </fieldset>
  );
}

function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-11 rounded-sm border px-3 text-sm transition-colors duration-200",
        selected
          ? "border-ink-900 bg-ink-900 text-ivory"
          : "border-sand-300 text-ink-800 hover:border-stone-400",
      )}
    >
      {children}
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-800">
      <Checkbox checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
