"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  AMENITY_CATALOG,
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  FURNISHING_LABELS,
  FURNISHING_OPTIONS,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  SUPPORTED_CURRENCIES,
  type AmenityKey,
} from "@/config/property-options";
import { formatPrice } from "@/lib/format";
import { slugify } from "@/lib/slug";
import type { PropertyInput } from "@/lib/validation/admin";
import type { AdminOptions } from "@/server/queries/admin";
import { savePropertyAction } from "@/server/actions/admin";
import { Pill, Panel, STATUS_TONES } from "./ui";
import {
  AdminField,
  SaveBar,
  Toggle,
  a11y,
  adminButton,
  adminInput,
  adminTextarea,
} from "./form-kit";
import { GalleryEditor } from "./media-upload";

const LocationPicker = dynamic(() => import("./location-picker-canvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-sand-100 text-sm text-stone-600">
      Loading map…
    </div>
  ),
});

type Errors = Record<string, string>;

const num = (value: string) => (value === "" ? undefined : Number(value));

export function PropertyForm({
  id,
  initial,
  options,
  isAdmin,
  canPublish,
}: {
  id: string | null;
  initial: PropertyInput;
  options: AdminOptions;
  isAdmin: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [data, setData] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(data) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) =>
    setData((current) => ({ ...current, [key]: value }));
  const setIn = <K extends "price" | "specs" | "flags" | "location" | "seo" | "virtualTour">(
    key: K,
    patch: Partial<PropertyInput[K]>,
  ) => setData((current) => ({ ...current, [key]: { ...current[key], ...patch } }));

  const city = useMemo(
    () => options.cities.find((c) => c.slug === data.location.citySlug),
    [options.cities, data.location.citySlug],
  );
  const neighbourhood = city?.neighbourhoods.find(
    (n) => n.slug === data.location.neighbourhoodSlug,
  );
  const mapCenter = neighbourhood?.center ?? city?.center ?? { lat: 23.8103, lng: 90.4125 };
  const pin =
    data.location.lat !== undefined && data.location.lng !== undefined
      ? { lat: data.location.lat, lng: data.location.lng }
      : null;

  const save = (status: PropertyInput["status"]) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await savePropertyAction(id, { ...data, status });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        document
          .querySelector("[aria-invalid=true]")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setErrors({});
      const next = { ...data, status, slug: result.data.slug };
      setData(next);
      setBaseline(JSON.stringify(next));
      notify(status === "published" ? "Listing published" : "Listing saved", { tone: "success" });
      if (!id) router.replace(`/admin/properties/${result.data.id}`);
      else router.refresh();
    });
  };

  const e = (path: string) => errors[path];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save(data.status);
      }}
      className="space-y-6"
    >
      <Panel title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField id="title" label="Title" error={e("title")} className="md:col-span-2">
            <input
              {...a11y("title", e("title"))}
              value={data.title}
              maxLength={140}
              onChange={(ev) => set("title", ev.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="slug"
            label="URL slug"
            hint={`/properties/${data.slug || slugify(data.title || "new-listing")}`}
            error={e("slug")}
          >
            <input
              {...a11y("slug", e("slug"))}
              value={data.slug}
              placeholder="Generated from the title"
              maxLength={100}
              onChange={(ev) => set("slug", ev.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="headline"
            label="Headline"
            hint="One sentence shown under the title"
            error={e("headline")}
          >
            <input
              {...a11y("headline", e("headline"))}
              value={data.headline}
              maxLength={220}
              onChange={(ev) => set("headline", ev.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="description"
            label="Description"
            hint="Separate paragraphs with a blank line"
            error={e("description")}
            className="md:col-span-2"
          >
            <textarea
              {...a11y("description", e("description"))}
              rows={9}
              value={data.description}
              maxLength={12000}
              onChange={(ev) => set("description", ev.target.value)}
              className={adminTextarea}
            />
          </AdminField>
        </div>
      </Panel>

      <Panel title="Transaction & price">
        <div className="grid gap-4 md:grid-cols-4">
          <AdminField id="listingType" label="Listing">
            <select
              id="listingType"
              value={data.listingType}
              onChange={(ev) => set("listingType", ev.target.value as PropertyInput["listingType"])}
              className={adminInput}
            >
              {LISTING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {LISTING_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField id="propertyType" label="Property type">
            <select
              id="propertyType"
              value={data.propertyType}
              onChange={(ev) =>
                set("propertyType", ev.target.value as PropertyInput["propertyType"])
              }
              className={adminInput}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROPERTY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField id="availability" label="Availability">
            <select
              id="availability"
              value={data.availability}
              onChange={(ev) =>
                set("availability", ev.target.value as PropertyInput["availability"])
              }
              className={adminInput}
            >
              {AVAILABILITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {AVAILABILITY_LABELS[status]}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField id="currency" label="Currency">
            <select
              id="currency"
              value={data.price.currency}
              onChange={(ev) =>
                setIn("price", { currency: ev.target.value as PropertyInput["price"]["currency"] })
              }
              className={adminInput}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </AdminField>
          <AdminField
            id="price"
            label={data.listingType === "rent" ? "Monthly rent" : "Price"}
            hint={
              data.price.amount
                ? formatPrice(data.price.amount, data.price.currency, { compact: true })
                : undefined
            }
            error={e("price.amount")}
            className="md:col-span-2"
          >
            <input
              {...a11y("price", e("price.amount"))}
              type="number"
              min={0}
              inputMode="numeric"
              value={data.price.amount || ""}
              onChange={(ev) => setIn("price", { amount: num(ev.target.value) ?? 0 })}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="previousAmount"
            label="Previous price"
            hint="Optional — shows a price-reduced badge"
            error={e("price.previousAmount")}
            className="md:col-span-2"
          >
            <input
              {...a11y("previousAmount", e("price.previousAmount"))}
              type="number"
              min={0}
              inputMode="numeric"
              value={data.price.previousAmount ?? ""}
              onChange={(ev) => setIn("price", { previousAmount: num(ev.target.value) })}
              className={adminInput}
            />
          </AdminField>
          <div className="md:col-span-4">
            <Toggle
              id="onRequest"
              label="Price on request"
              description="Hides the price publicly; it is still used for internal search filtering."
              checked={data.price.onRequest}
              onChange={(onRequest) => setIn("price", { onRequest })}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Specification">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {(
            [
              ["bedrooms", "Bedrooms"],
              ["bathrooms", "Bathrooms"],
              ["parkingSpaces", "Parking spaces"],
              ["areaSqft", "Interior area (sq ft)"],
              ["landAreaSqft", "Land area (sq ft)"],
              ["yearBuilt", "Year built"],
              ["floors", "Floors"],
              ["floorLevel", "Floor level"],
            ] as const
          ).map(([key, label]) => (
            <AdminField key={key} id={key} label={label} error={e(`specs.${key}`)}>
              <input
                {...a11y(key, e(`specs.${key}`))}
                type="number"
                inputMode="numeric"
                value={data.specs[key] ?? ""}
                onChange={(ev) =>
                  setIn("specs", {
                    [key]:
                      key === "bedrooms" || key === "bathrooms" || key === "parkingSpaces"
                        ? (num(ev.target.value) ?? 0)
                        : num(ev.target.value),
                  })
                }
                className={adminInput}
              />
            </AdminField>
          ))}
          <AdminField id="furnishing" label="Furnishing">
            <select
              id="furnishing"
              value={data.specs.furnishing}
              onChange={(ev) =>
                setIn("specs", {
                  furnishing: ev.target.value as PropertyInput["specs"]["furnishing"],
                })
              }
              className={adminInput}
            >
              <option value="">Not specified</option>
              {FURNISHING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {FURNISHING_LABELS[option]}
                </option>
              ))}
            </select>
          </AdminField>
        </div>
      </Panel>

      <Panel title="Features & placement">
        <div className="grid gap-6 md:grid-cols-3">
          {AMENITY_CATALOG.map((group) => (
            <fieldset key={group.category}>
              <legend className="mb-2 text-xs font-semibold text-stone-700">{group.label}</legend>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <Toggle
                    key={item.key}
                    id={`amenity-${item.key}`}
                    label={item.label}
                    checked={data.amenities.includes(item.key)}
                    onChange={(checked) =>
                      set(
                        "amenities",
                        checked
                          ? [...data.amenities, item.key as AmenityKey]
                          : data.amenities.filter((key) => key !== item.key),
                      )
                    }
                  />
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-stone-700">Placement</legend>
            <div className="space-y-2">
              <Toggle
                id="newConstruction"
                label="New construction"
                checked={data.flags.newConstruction}
                onChange={(newConstruction) => setIn("flags", { newConstruction })}
              />
              <Toggle
                id="featured"
                label="Featured on the homepage"
                disabled={!isAdmin}
                description={isAdmin ? undefined : "Set by an administrator"}
                checked={data.flags.featured}
                onChange={(featured) => setIn("flags", { featured })}
              />
              <Toggle
                id="exclusive"
                label="Exclusive listing"
                disabled={!isAdmin}
                description={isAdmin ? undefined : "Set by an administrator"}
                checked={data.flags.exclusive}
                onChange={(exclusive) => setIn("flags", { exclusive })}
              />
            </div>
          </fieldset>
        </div>
      </Panel>

      <Panel
        title="Location"
        description="Exact coordinates are only shown publicly when “show exact location” is on; otherwise maps show a ~1 km area."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <AdminField id="city" label="City" error={e("location.citySlug")}>
              <select
                {...a11y("city", e("location.citySlug"))}
                value={data.location.citySlug}
                onChange={(ev) =>
                  setIn("location", { citySlug: ev.target.value, neighbourhoodSlug: "" })
                }
                className={adminInput}
              >
                <option value="">Choose a city</option>
                {options.cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              id="neighbourhood"
              label="Neighbourhood"
              error={e("location.neighbourhoodSlug")}
            >
              <select
                {...a11y("neighbourhood", e("location.neighbourhoodSlug"))}
                value={data.location.neighbourhoodSlug}
                disabled={!city?.neighbourhoods.length}
                onChange={(ev) => setIn("location", { neighbourhoodSlug: ev.target.value })}
                className={adminInput}
              >
                <option value="">
                  {city?.neighbourhoods.length ? "Whole city" : "No neighbourhoods"}
                </option>
                {city?.neighbourhoods.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              id="displayAddress"
              label="Public address"
              hint="e.g. “Road 11, Banani” — shown on the listing"
              className="sm:col-span-2"
            >
              <input
                id="displayAddress"
                value={data.location.displayAddress}
                maxLength={200}
                onChange={(ev) => setIn("location", { displayAddress: ev.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField
              id="addressLine"
              label="Full address (private)"
              hint="Never shown publicly"
              className="sm:col-span-2"
            >
              <input
                id="addressLine"
                value={data.location.addressLine}
                maxLength={300}
                onChange={(ev) => setIn("location", { addressLine: ev.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField id="lat" label="Latitude" error={e("location.lat")}>
              <input
                {...a11y("lat", e("location.lat"))}
                type="number"
                step="0.000001"
                value={data.location.lat ?? ""}
                onChange={(ev) => setIn("location", { lat: num(ev.target.value) })}
                className={adminInput}
              />
            </AdminField>
            <AdminField id="lng" label="Longitude">
              <input
                id="lng"
                type="number"
                step="0.000001"
                value={data.location.lng ?? ""}
                onChange={(ev) => setIn("location", { lng: num(ev.target.value) })}
                className={adminInput}
              />
            </AdminField>
            <div className="sm:col-span-2">
              <Toggle
                id="showExact"
                label="Show exact location publicly"
                checked={data.location.showExactLocation}
                onChange={(showExactLocation) => setIn("location", { showExactLocation })}
              />
            </div>
          </div>
          <div className="h-72 overflow-hidden rounded-sm border border-sand-200 lg:h-full lg:min-h-80">
            <LocationPicker
              value={pin}
              fallbackCenter={mapCenter}
              onChange={(point) => setIn("location", point)}
            />
          </div>
        </div>
      </Panel>

      <Panel
        title="Photographs"
        description="Landscape images of at least 2000px wide look best. Every image needs alt text for accessibility and search."
      >
        <GalleryEditor
          images={data.images}
          onChange={(images) => set("images", images)}
          kind="property"
          error={e("images")}
        />
      </Panel>

      <Panel title="Floor plans">
        <GalleryEditor
          images={data.floorPlans}
          onChange={(floorPlans) => set("floorPlans", floorPlans)}
          kind="floorplan"
          withLabel
        />
      </Panel>

      <Panel
        title="Video & virtual tour"
        description="YouTube, Vimeo, Matterport, Kuula and Momento360 links are embedded; other links open in a new tab."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField id="videoUrl" label="Video URL" error={e("videoUrl")}>
            <input
              {...a11y("videoUrl", e("videoUrl"))}
              type="url"
              value={data.videoUrl}
              placeholder="https://"
              onChange={(ev) => set("videoUrl", ev.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField id="tourUrl" label="Virtual tour URL" error={e("virtualTour.url")}>
            <input
              {...a11y("tourUrl", e("virtualTour.url"))}
              type="url"
              value={data.virtualTour.url}
              placeholder="https://"
              onChange={(ev) => setIn("virtualTour", { url: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField id="tourKind" label="Tour type">
            <select
              id="tourKind"
              value={data.virtualTour.kind}
              onChange={(ev) =>
                setIn("virtualTour", {
                  kind: ev.target.value as PropertyInput["virtualTour"]["kind"],
                })
              }
              className={adminInput}
            >
              <option value="tour360">360° tour</option>
              <option value="video">Video tour</option>
              <option value="external">External link</option>
            </select>
          </AdminField>
        </div>
      </Panel>

      <Panel title="Advisor & search appearance">
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField
            id="agentId"
            label="Advisor"
            error={e("agentId")}
            hint={isAdmin ? undefined : "Listings you create are assigned to you"}
          >
            <select
              {...a11y("agentId", e("agentId"))}
              value={data.agentId}
              disabled={!isAdmin}
              onChange={(ev) => set("agentId", ev.target.value)}
              className={adminInput}
            >
              <option value="">Unassigned</option>
              {options.agents.map((agent) => (
                <option key={agent.id} value={agent.id} disabled={!agent.active}>
                  {agent.name}
                  {agent.active ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField
            id="seoTitle"
            label="SEO title"
            hint={`${data.seo.title.length}/70 — defaults to the title and location`}
            error={e("seo.title")}
          >
            <input
              {...a11y("seoTitle", e("seo.title"))}
              value={data.seo.title}
              maxLength={70}
              onChange={(ev) => setIn("seo", { title: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="seoDescription"
            label="SEO description"
            hint={`${data.seo.description.length}/170`}
            error={e("seo.description")}
          >
            <input
              {...a11y("seoDescription", e("seo.description"))}
              value={data.seo.description}
              maxLength={170}
              onChange={(ev) => setIn("seo", { description: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
        </div>
      </Panel>

      <SaveBar
        error={formError}
        status={
          <span className="flex items-center gap-2">
            <Pill tone={STATUS_TONES[data.status]}>{data.status}</Pill>
            {dirty ? "Unsaved changes" : id ? "All changes saved" : "Not saved yet"}
            {id && data.status === "published" ? (
              <Link
                href={`/properties/${data.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-ink-900 underline underline-offset-2"
              >
                View <ExternalLink aria-hidden className="size-3" />
              </Link>
            ) : null}
          </span>
        }
      >
        {data.status === "published" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => save("draft")}
              className={adminButton.secondary}
            >
              Unpublish
            </button>
            <button type="submit" disabled={pending} className={adminButton.primary}>
              {pending ? "Saving…" : "Update listing"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => save("draft")}
              className={adminButton.secondary}
            >
              {pending ? "Saving…" : "Save draft"}
            </button>
            {canPublish ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => save("published")}
                className={adminButton.primary}
              >
                Publish
              </button>
            ) : null}
          </>
        )}
      </SaveBar>
    </form>
  );
}
