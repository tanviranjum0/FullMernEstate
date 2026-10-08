"use client";

import type { AgentInput } from "@/lib/validation/admin";
import type { AdminOptions } from "@/server/queries/admin";
import { saveAgentAction } from "@/server/actions/admin";
import { AdminField, ListInput, SaveBar, Toggle, a11y, adminButton, adminInput, adminTextarea } from "./form-kit";
import { SingleImageField } from "./media-upload";
import { Panel } from "./ui";
import { useAdminSave } from "./use-admin-save";

export function AgentForm({ id, initial, options }: { id: string | null; initial: AgentInput; options: AdminOptions }) {
  const { data, setData, errors, formError, pending, dirty, submit } = useAdminSave({
    initial,
    save: (input) => saveAgentAction(id, input),
    editPath: (newId) => `/admin/agents/${newId}`,
    isNew: !id,
    successMessage: "Advisor saved",
  });
  const set = <K extends keyof AgentInput>(key: K, value: AgentInput[K]) => setData((current) => ({ ...current, [key]: value }));
  const e = (key: string) => errors[key];
  const areaOptions = options.cities.flatMap((city) => [{ slug: city.slug, name: city.name }, ...city.neighbourhoods.map((n) => ({ slug: n.slug, name: `${n.name}, ${city.name}` }))]);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Panel title="Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField id="name" label="Full name" error={e("name")}>
            <input {...a11y("name", e("name"))} value={data.name} maxLength={120} onChange={(ev) => set("name", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="title" label="Title" hint="e.g. Senior Advisor, Gulshan & Baridhara" error={e("title")}>
            <input {...a11y("title", e("title"))} value={data.title} maxLength={120} onChange={(ev) => set("title", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="slug" label="URL slug" hint={`/agents/${data.slug || "generated-from-name"}`} error={e("slug")}>
            <input {...a11y("slug", e("slug"))} value={data.slug} maxLength={100} onChange={(ev) => set("slug", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="sortOrder" label="Display order" hint="Lower numbers appear first">
            <input id="sortOrder" type="number" value={data.sortOrder} onChange={(ev) => set("sortOrder", Number(ev.target.value) || 0)} className={adminInput} />
          </AdminField>
          <AdminField id="bio" label="Biography" hint="Separate paragraphs with a blank line. Avoid unverifiable claims." error={e("bio")} className="md:col-span-2">
            <textarea {...a11y("bio", e("bio"))} rows={7} value={data.bio} maxLength={6000} onChange={(ev) => set("bio", ev.target.value)} className={adminTextarea} />
          </AdminField>
          <div className="md:col-span-2">
            <SingleImageField label="Portrait" kind="agent" value={data.photo} onChange={(photo) => set("photo", photo)} error={e("photo")} />
          </div>
          <div className="md:col-span-2">
            <Toggle id="active" label="Active" description="Inactive advisors are hidden from the website and cannot receive new listings." checked={data.active} onChange={(active) => set("active", active)} />
          </div>
        </div>
      </Panel>

      <Panel title="Contact & expertise">
        <div className="grid gap-4 md:grid-cols-3">
          <AdminField id="email" label="Public email" error={e("email")}>
            <input {...a11y("email", e("email"))} type="email" value={data.email} onChange={(ev) => set("email", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="phone" label="Phone">
            <input id="phone" type="tel" value={data.phone} maxLength={40} onChange={(ev) => set("phone", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="whatsapp" label="WhatsApp number">
            <input id="whatsapp" type="tel" value={data.whatsapp} maxLength={40} onChange={(ev) => set("whatsapp", ev.target.value)} className={adminInput} />
          </AdminField>
          <AdminField id="languages" label="Languages" hint="Comma separated">
            <ListInput id="languages" value={data.languages} onChange={(languages) => set("languages", languages)} />
          </AdminField>
          <AdminField id="specialties" label="Specialties" hint="Comma separated" className="md:col-span-2">
            <ListInput id="specialties" value={data.specialties} onChange={(specialties) => set("specialties", specialties)} />
          </AdminField>
          <fieldset className="md:col-span-3">
            <legend className="mb-2 text-xs font-semibold text-stone-700">Areas covered</legend>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {areaOptions.map((area) => (
                <Toggle
                  key={area.slug}
                  id={`area-${area.slug}`}
                  label={area.name}
                  checked={data.areas.includes(area.slug)}
                  onChange={(checked) => set("areas", checked ? [...data.areas, area.slug] : data.areas.filter((slug) => slug !== area.slug))}
                />
              ))}
            </div>
          </fieldset>
          <AdminField id="linkedin" label="LinkedIn URL" error={e("socials.linkedin")}>
            <input {...a11y("linkedin", e("socials.linkedin"))} type="url" value={data.socials.linkedin} onChange={(ev) => set("socials", { ...data.socials, linkedin: ev.target.value })} className={adminInput} />
          </AdminField>
          <AdminField id="instagram" label="Instagram URL" error={e("socials.instagram")}>
            <input {...a11y("instagram", e("socials.instagram"))} type="url" value={data.socials.instagram} onChange={(ev) => set("socials", { ...data.socials, instagram: ev.target.value })} className={adminInput} />
          </AdminField>
          <AdminField id="website" label="Website" error={e("socials.website")}>
            <input {...a11y("website", e("socials.website"))} type="url" value={data.socials.website} onChange={(ev) => set("socials", { ...data.socials, website: ev.target.value })} className={adminInput} />
          </AdminField>
        </div>
      </Panel>

      <Panel title="Sign-in access" description="Link the advisor's own account so they can manage their listings and enquiries. The account is given the Advisor role.">
        <AdminField id="userEmail" label="Account email" hint="The advisor must have registered on the site first. Leave empty to unlink." error={e("userEmail")}>
          <input {...a11y("userEmail", e("userEmail"))} type="email" value={data.userEmail} onChange={(ev) => set("userEmail", ev.target.value)} className={`${adminInput} max-w-md`} />
        </AdminField>
      </Panel>

      <SaveBar error={formError} status={dirty ? "Unsaved changes" : id ? "All changes saved" : "Not saved yet"}>
        <button type="submit" disabled={pending} className={adminButton.primary}>
          {pending ? "Saving…" : id ? "Save advisor" : "Create advisor"}
        </button>
      </SaveBar>
    </form>
  );
}
