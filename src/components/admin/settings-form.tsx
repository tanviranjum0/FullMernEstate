"use client";

import type { SiteSettingsInput } from "@/lib/validation/admin";
import { saveSettingsAction } from "@/server/actions/admin";
import {
  AdminField,
  Repeater,
  SaveBar,
  Toggle,
  a11y,
  adminButton,
  adminInput,
  adminTextarea,
} from "./form-kit";
import { MarkdownEditor } from "./markdown-editor";
import { SingleImageField } from "./media-upload";
import { Panel } from "./ui";
import { useAdminSave } from "./use-admin-save";

type Section<K extends keyof SiteSettingsInput> = SiteSettingsInput[K];

export function SettingsForm({ initial }: { initial: SiteSettingsInput }) {
  const { data, setData, errors, formError, pending, dirty, submit } = useAdminSave({
    initial,
    save: saveSettingsAction,
    isNew: false,
    successMessage: "Settings saved",
  });
  const patch = <K extends keyof SiteSettingsInput>(
    key: K,
    value: Partial<Section<K>> | Section<K>,
  ) =>
    setData((current) => ({
      ...current,
      [key]:
        Array.isArray(value) || typeof value !== "object" || value === null
          ? value
          : { ...(current[key] as object), ...value },
    }));
  const e = (key: string) => errors[key];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Panel
        title="Announcement"
        description="A single line shown above the header on every public page. Leave empty to hide it."
      >
        <AdminField
          id="announcement"
          label="Announcement text"
          hint={`${data.announcement.length}/240`}
          error={e("announcement")}
        >
          <input
            {...a11y("announcement", e("announcement"))}
            value={data.announcement}
            maxLength={240}
            onChange={(ev) => patch("announcement", ev.target.value)}
            className={adminInput}
          />
        </AdminField>
      </Panel>

      <Panel
        title="Contact details"
        description="Used in the footer, contact page, structured data and enquiry emails."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField id="contact-email" label="Public email" error={e("contact.email")}>
            <input
              {...a11y("contact-email", e("contact.email"))}
              type="email"
              value={data.contact.email}
              onChange={(ev) => patch("contact", { email: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField id="contact-phone" label="Phone" error={e("contact.phone")}>
            <input
              {...a11y("contact-phone", e("contact.phone"))}
              type="tel"
              value={data.contact.phone}
              onChange={(ev) => patch("contact", { phone: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="contact-whatsapp"
            label="WhatsApp number"
            hint="International format, e.g. +8801…"
            error={e("contact.whatsapp")}
          >
            <input
              {...a11y("contact-whatsapp", e("contact.whatsapp"))}
              type="tel"
              value={data.contact.whatsapp}
              onChange={(ev) => patch("contact", { whatsapp: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField id="contact-hours" label="Office hours" error={e("contact.officeHours")}>
            <input
              {...a11y("contact-hours", e("contact.officeHours"))}
              value={data.contact.officeHours}
              onChange={(ev) => patch("contact", { officeHours: ev.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            id="contact-address"
            label="Office address"
            className="md:col-span-2"
            error={e("contact.address")}
          >
            <textarea
              {...a11y("contact-address", e("contact.address"))}
              rows={2}
              value={data.contact.address}
              onChange={(ev) => patch("contact", { address: ev.target.value })}
              className={adminTextarea}
            />
          </AdminField>
        </div>
      </Panel>

      <Panel
        title="Social profiles"
        description="Only add profiles that exist. Empty links are hidden."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(["instagram", "linkedin", "facebook", "youtube"] as const).map((network) => (
            <AdminField
              key={network}
              id={`social-${network}`}
              label={network[0]!.toUpperCase() + network.slice(1)}
              error={e(`social.${network}`)}
            >
              <input
                {...a11y(`social-${network}`, e(`social.${network}`))}
                type="url"
                placeholder="https://"
                value={data.social[network]}
                onChange={(ev) => patch("social", { [network]: ev.target.value })}
                className={adminInput}
              />
            </AdminField>
          ))}
        </div>
      </Panel>

      <Panel title="Homepage hero">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField id="hero-eyebrow" label="Eyebrow" error={e("hero.eyebrow")}>
              <input
                {...a11y("hero-eyebrow", e("hero.eyebrow"))}
                value={data.hero.eyebrow}
                maxLength={80}
                onChange={(ev) => patch("hero", { eyebrow: ev.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField id="hero-headline" label="Headline" error={e("hero.headline")}>
              <input
                {...a11y("hero-headline", e("hero.headline"))}
                value={data.hero.headline}
                maxLength={120}
                onChange={(ev) => patch("hero", { headline: ev.target.value })}
                className={adminInput}
              />
            </AdminField>
          </div>
          <AdminField id="hero-sub" label="Supporting line" error={e("hero.subheadline")}>
            <textarea
              {...a11y("hero-sub", e("hero.subheadline"))}
              rows={2}
              value={data.hero.subheadline}
              maxLength={300}
              onChange={(ev) => patch("hero", { subheadline: ev.target.value })}
              className={adminTextarea}
            />
          </AdminField>
          <SingleImageField
            label="Hero image"
            kind="site"
            value={data.hero.image}
            onChange={(image) => patch("hero", { image })}
          />
          <p className="text-xs text-stone-500">
            Without an uploaded image the homepage uses the built-in coastal villa photograph.
          </p>
        </div>
      </Panel>

      <Panel
        title="About the firm"
        description="Shown on the homepage and the About page. Describe what the firm actually does; avoid unverifiable figures."
      >
        <div className="space-y-5">
          <AdminField id="about-story" label="Story" error={e("about.story")}>
            <MarkdownEditor
              id="about-story"
              value={data.about.story}
              onChange={(story) => patch("about", { story })}
              maxLength={12000}
              rows={10}
              error={e("about.story")}
            />
          </AdminField>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-stone-700">Values</legend>
            <Repeater
              items={data.about.values}
              onChange={(values) => patch("about", { values })}
              create={() => ({ title: "", text: "" })}
              addLabel="Add value"
              max={8}
              render={(value, update, index) => (
                <>
                  <label className="sr-only" htmlFor={`value-title-${index}`}>
                    Value title
                  </label>
                  <input
                    id={`value-title-${index}`}
                    placeholder="Title"
                    value={value.title}
                    onChange={(ev) => update({ title: ev.target.value })}
                    className={adminInput}
                    aria-invalid={e(`about.values.${index}.title`) ? true : undefined}
                  />
                  <label className="sr-only" htmlFor={`value-text-${index}`}>
                    Value description
                  </label>
                  <textarea
                    id={`value-text-${index}`}
                    placeholder="Description"
                    rows={2}
                    value={value.text}
                    onChange={(ev) => update({ text: ev.target.value })}
                    className={adminTextarea}
                    aria-invalid={e(`about.values.${index}.text`) ? true : undefined}
                  />
                </>
              )}
            />
          </fieldset>
        </div>
      </Panel>

      <Panel
        title="Client testimonials"
        description="Only publish quotes from real clients who agreed to be quoted. Unpublished testimonials are stored but never shown."
      >
        <Repeater
          items={data.testimonials}
          onChange={(testimonials) => patch("testimonials", testimonials)}
          create={() => ({ quote: "", author: "", context: "", published: false })}
          addLabel="Add testimonial"
          render={(item, update, index) => (
            <>
              <label className="sr-only" htmlFor={`t-quote-${index}`}>
                Quote
              </label>
              <textarea
                id={`t-quote-${index}`}
                placeholder="Quote"
                rows={3}
                value={item.quote}
                onChange={(ev) => update({ quote: ev.target.value })}
                className={adminTextarea}
                aria-invalid={e(`testimonials.${index}.quote`) ? true : undefined}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="sr-only" htmlFor={`t-author-${index}`}>
                  Author
                </label>
                <input
                  id={`t-author-${index}`}
                  placeholder="Client name (as they agreed to be credited)"
                  value={item.author}
                  onChange={(ev) => update({ author: ev.target.value })}
                  className={adminInput}
                  aria-invalid={e(`testimonials.${index}.author`) ? true : undefined}
                />
                <label className="sr-only" htmlFor={`t-context-${index}`}>
                  Context
                </label>
                <input
                  id={`t-context-${index}`}
                  placeholder="Context, e.g. Purchased in Gulshan"
                  value={item.context}
                  onChange={(ev) => update({ context: ev.target.value })}
                  className={adminInput}
                />
              </div>
              <Toggle
                id={`t-published-${index}`}
                label="Published (client consent confirmed)"
                checked={item.published}
                onChange={(published) => update({ published })}
              />
            </>
          )}
        />
      </Panel>

      <Panel
        title="Frequently asked questions"
        description="Shown on the contact page and marked up as FAQ structured data."
      >
        <Repeater
          items={data.faqs}
          onChange={(faqs) => patch("faqs", faqs)}
          create={() => ({ question: "", answer: "" })}
          addLabel="Add question"
          render={(faq, update, index) => (
            <>
              <label className="sr-only" htmlFor={`faq-q-${index}`}>
                Question
              </label>
              <input
                id={`faq-q-${index}`}
                placeholder="Question"
                value={faq.question}
                onChange={(ev) => update({ question: ev.target.value })}
                className={adminInput}
                aria-invalid={e(`faqs.${index}.question`) ? true : undefined}
              />
              <label className="sr-only" htmlFor={`faq-a-${index}`}>
                Answer
              </label>
              <textarea
                id={`faq-a-${index}`}
                placeholder="Answer"
                rows={3}
                value={faq.answer}
                onChange={(ev) => update({ answer: ev.target.value })}
                className={adminTextarea}
                aria-invalid={e(`faqs.${index}.answer`) ? true : undefined}
              />
            </>
          )}
        />
      </Panel>

      <SaveBar error={formError} status={dirty ? "Unsaved changes" : "All changes saved"}>
        <button type="submit" disabled={pending || !dirty} className={adminButton.primary}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </SaveBar>
    </form>
  );
}
