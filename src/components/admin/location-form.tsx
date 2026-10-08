"use client";

import dynamic from "next/dynamic";
import type { LocationInput } from "@/lib/validation/admin";
import type { AdminOptions } from "@/server/queries/admin";
import { saveLocationAction } from "@/server/actions/admin";
import { AdminField, ListInput, Repeater, SaveBar, Toggle, a11y, adminButton, adminInput, adminTextarea } from "./form-kit";
import { MarkdownEditor } from "./markdown-editor";
import { SingleImageField } from "./media-upload";
import { Panel } from "./ui";
import { useAdminSave } from "./use-admin-save";

const LocationPicker = dynamic(() => import("./location-picker-canvas"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-sand-100 text-sm text-stone-600">Loading map…</div>,
});

export function LocationForm({ id, initial, options }: { id: string | null; initial: LocationInput; options: AdminOptions }) {
  const { data, setData, errors, formError, pending, dirty, submit } = useAdminSave({
    initial,
    save: (input) => saveLocationAction(id, input),
    editPath: (newId) => `/admin/locations/${newId}`,
    isNew: !id,
    successMessage: "Location saved",
  });
  const set = <K extends keyof LocationInput>(key: K, value: LocationInput[K]) => setData((current) => ({ ...current, [key]: value }));
  const e = (key: string) => errors[key];
  const center = data.lat !== undefined && data.lng !== undefined ? { lat: data.lat, lng: data.lng } : null;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Panel title="Location">
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField id="kind" label="Type">
            <select id="kind" value={data.kind} disabled={Boolean(id)} onChange={(ev) => set("kind", ev.target.value as LocationInput["kind"])} className={adminInput}>
              <option value="city">City</option>
              <option value="neighbourhood">Neighbourhood</option>
            </select>
          </AdminField>
          {data.kind === "neighbourhood" ? (
            <AdminField id="parentSlug" label="City" error={e("parentSlug")}>
              <select {...a11y("parentSlug", e("parentSlug"))} value={data.parentSlug} disabled={Boolean(id)} onChange={(ev) => set("parentSlug", ev.target.value)} className={adminInput}>
                <option value="">Choose a city</option>
                {options.cities.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>
            </AdminField>
          ) : null}
          <AdminField id="name" label="Name" error={e("name")}>
            <input {...a11y("name", e("name"))} value={data.name} maxLength={120} onChange={(ev) => set("name", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="slug" label="URL slug" hint="Locked once listings use it" error={e("slug")}>
            <input {...a11y("slug", e("slug"))} value={data.slug} maxLength={100} onChange={(ev) => set("slug", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="sortOrder" label="Display order">
            <input id="sortOrder" type="number" value={data.sortOrder} onChange={(ev) => set("sortOrder", Number(ev.target.value) || 0)} className={adminInput} />
          </AdminField>
          <div className="self-end">
            <Toggle id="published" label="Published" description="Unpublished guides are hidden from the website" checked={data.published} onChange={(published) => set("published", published)} />
          </div>
        </div>
      </Panel>

      <Panel title="Guide content">
        <div className="space-y-4">
          <AdminField id="headline" label="Headline" error={e("headline")}>
            <input {...a11y("headline", e("headline"))} value={data.headline} maxLength={200} onChange={(ev) => set("headline", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="intro" label="Introduction" hint="One or two sentences shown on cards and as the opening paragraph" error={e("intro")}>
            <textarea {...a11y("intro", e("intro"))} rows={3} value={data.intro} maxLength={1200} onChange={(ev) => set("intro", ev.target.value)} className={adminTextarea} />
          </AdminField>
          <AdminField id="body" label="Guide body" error={e("body")}>
            <MarkdownEditor id="body" value={data.body} onChange={(body) => set("body", body)} maxLength={20000} error={e("body")} />
          </AdminField>
          <SingleImageField label="Hero image" kind="location" value={data.heroImage} onChange={(heroImage) => set("heroImage", heroImage)} />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField id="lifestyle" label="Lifestyle tags" hint="Comma separated">
              <ListInput id="lifestyle" value={data.lifestyle} onChange={(lifestyle) => set("lifestyle", lifestyle)} />
            </AdminField>
            <AdminField id="nearby" label="Nearby places" hint="Comma separated">
              <ListInput id="nearby" value={data.nearby} onChange={(nearby) => set("nearby", nearby)} />
            </AdminField>
          </div>
        </div>
      </Panel>

      <Panel title="Highlights">
        <Repeater
          items={data.highlights}
          onChange={(highlights) => set("highlights", highlights)}
          create={() => ({ title: "", text: "" })}
          addLabel="Add highlight"
          max={12}
          render={(item, update, index) => (
            <>
              <input aria-label={`Highlight ${index + 1} title`} placeholder="Title" value={item.title} maxLength={120} onChange={(ev) => update({ title: ev.target.value })} className={adminInput} />
              <textarea aria-label={`Highlight ${index + 1} text`} placeholder="Text" rows={2} value={item.text} maxLength={600} onChange={(ev) => update({ text: ev.target.value })} className={adminTextarea} />
            </>
          )}
        />
      </Panel>

      <Panel title="Frequently asked questions" description="Only add questions people genuinely ask; these are published as FAQ structured data.">
        <Repeater
          items={data.faqs}
          onChange={(faqs) => set("faqs", faqs)}
          create={() => ({ question: "", answer: "" })}
          addLabel="Add question"
          max={20}
          render={(item, update, index) => (
            <>
              <input aria-label={`Question ${index + 1}`} placeholder="Question" value={item.question} maxLength={240} onChange={(ev) => update({ question: ev.target.value })} className={adminInput} />
              <textarea aria-label={`Answer ${index + 1}`} placeholder="Answer" rows={3} value={item.answer} maxLength={2000} onChange={(ev) => update({ answer: ev.target.value })} className={adminTextarea} />
            </>
          )}
        />
        {e("faqs") ? <p className="mt-2 text-xs text-danger-600">{e("faqs")}</p> : null}
      </Panel>

      <Panel title="Map & search appearance">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid content-start gap-4 sm:grid-cols-3">
            <AdminField id="lat" label="Centre latitude">
              <input id="lat" type="number" step="0.0001" value={data.lat ?? ""} onChange={(ev) => set("lat", ev.target.value === "" ? undefined : Number(ev.target.value))} className={adminInput} />
            </AdminField>
            <AdminField id="lng" label="Centre longitude">
              <input id="lng" type="number" step="0.0001" value={data.lng ?? ""} onChange={(ev) => set("lng", ev.target.value === "" ? undefined : Number(ev.target.value))} className={adminInput} />
            </AdminField>
            <AdminField id="zoom" label="Map zoom">
              <input id="zoom" type="number" min={1} max={18} value={data.zoom} onChange={(ev) => set("zoom", Number(ev.target.value) || 12)} className={adminInput} />
            </AdminField>
            <AdminField id="seoTitle" label="SEO title" hint={`${data.seo.title.length}/70`} className="sm:col-span-3">
              <input id="seoTitle" value={data.seo.title} maxLength={70} onChange={(ev) => set("seo", { ...data.seo, title: ev.target.value })} className={adminInput} />
            </AdminField>
            <AdminField id="seoDescription" label="SEO description" hint={`${data.seo.description.length}/170`} className="sm:col-span-3">
              <textarea id="seoDescription" rows={2} value={data.seo.description} maxLength={170} onChange={(ev) => set("seo", { ...data.seo, description: ev.target.value })} className={adminTextarea} />
            </AdminField>
          </div>
          <div className="h-72 overflow-hidden rounded-sm border border-sand-200">
            <LocationPicker value={center} fallbackCenter={center ?? { lat: 23.8103, lng: 90.4125 }} onChange={(point) => setData((current) => ({ ...current, ...point }))} />
          </div>
        </div>
      </Panel>

      <SaveBar error={formError} status={dirty ? "Unsaved changes" : id ? "All changes saved" : "Not saved yet"}>
        <button type="submit" disabled={pending} className={adminButton.primary}>
          {pending ? "Saving…" : id ? "Save location" : "Create location"}
        </button>
      </SaveBar>
    </form>
  );
}
