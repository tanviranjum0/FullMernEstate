"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ARTICLE_CATEGORIES } from "@/config/domain";
import type { ArticleInput } from "@/lib/validation/admin";
import type { AdminOptions } from "@/server/queries/admin";
import { saveArticleAction } from "@/server/actions/admin";
import { AdminField, ListInput, SaveBar, Toggle, a11y, adminButton, adminInput, adminTextarea } from "./form-kit";
import { MarkdownEditor } from "./markdown-editor";
import { SingleImageField } from "./media-upload";
import { DeleteArticleButton } from "./row-actions";
import { Panel, Pill, STATUS_TONES } from "./ui";
import { useAdminSave } from "./use-admin-save";

export function ArticleForm({ id, initial, options }: { id: string | null; initial: ArticleInput; options: AdminOptions }) {
  const { data, setData, errors, formError, pending, dirty, submit } = useAdminSave({
    initial,
    save: (input) => saveArticleAction(id, input),
    editPath: (newId) => `/admin/insights/${newId}`,
    isNew: !id,
    successMessage: "Article saved",
  });
  const set = <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => setData((current) => ({ ...current, [key]: value }));
  const e = (key: string) => errors[key];
  const locationOptions = options.cities.flatMap((city) => [{ slug: city.slug, name: city.name }, ...city.neighbourhoods.map((n) => ({ slug: n.slug, name: n.name }))]);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Panel title="Article">
        <div className="space-y-4">
          <AdminField id="title" label="Title" error={e("title")}>
            <input {...a11y("title", e("title"))} value={data.title} maxLength={160} onChange={(ev) => set("title", ev.target.value)} className={adminInput} />
          </AdminField>
          <div className="grid gap-4 md:grid-cols-3">
            <AdminField id="slug" label="URL slug" hint={`/insights/${data.slug || "generated-from-title"}`} error={e("slug")}>
              <input {...a11y("slug", e("slug"))} value={data.slug} maxLength={120} onChange={(ev) => set("slug", ev.target.value)} className={adminInput} />
            </AdminField>
            <AdminField id="category" label="Category">
              <select id="category" value={data.category} onChange={(ev) => set("category", ev.target.value as ArticleInput["category"])} className={adminInput}>
                {ARTICLE_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField id="author" label="Author" error={e("authorId")}>
              <select {...a11y("author", e("authorId"))} value={data.authorId} onChange={(ev) => set("authorId", ev.target.value)} className={adminInput}>
                <option value="">Editorial team</option>
                {options.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </AdminField>
          </div>
          <AdminField id="excerpt" label="Excerpt" hint="Shown on cards and as the default search description" error={e("excerpt")}>
            <textarea {...a11y("excerpt", e("excerpt"))} rows={2} value={data.excerpt} maxLength={320} onChange={(ev) => set("excerpt", ev.target.value)} className={adminTextarea} />
          </AdminField>
          <AdminField id="body" label="Body" error={e("body")}>
            <MarkdownEditor id="body" value={data.body} onChange={(body) => set("body", body)} maxLength={60000} rows={20} error={e("body")} />
          </AdminField>
          <SingleImageField label="Cover image" kind="article" value={data.coverImage} onChange={(coverImage) => set("coverImage", coverImage)} />
        </div>
      </Panel>

      <Panel title="Organisation & search">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField id="tags" label="Tags" hint="Comma separated">
            <ListInput id="tags" value={data.tags} onChange={(tags) => set("tags", tags)} />
          </AdminField>
          <div className="self-end">
            <Toggle id="featured" label="Feature on the homepage and insights page" checked={data.featured} onChange={(featured) => set("featured", featured)} />
          </div>
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-xs font-semibold text-stone-700">Related locations</legend>
            <div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {locationOptions.map((location) => (
                <Toggle
                  key={location.slug}
                  id={`loc-${location.slug}`}
                  label={location.name}
                  checked={data.relatedLocationSlugs.includes(location.slug)}
                  onChange={(checked) =>
                    set("relatedLocationSlugs", checked ? [...data.relatedLocationSlugs, location.slug] : data.relatedLocationSlugs.filter((slug) => slug !== location.slug))
                  }
                />
              ))}
            </div>
          </fieldset>
          <AdminField id="seoTitle" label="SEO title" hint={`${data.seo.title.length}/70`}>
            <input id="seoTitle" value={data.seo.title} maxLength={70} onChange={(ev) => set("seo", { ...data.seo, title: ev.target.value })} className={adminInput} />
          </AdminField>
          <AdminField id="seoDescription" label="SEO description" hint={`${data.seo.description.length}/170`}>
            <input id="seoDescription" value={data.seo.description} maxLength={170} onChange={(ev) => set("seo", { ...data.seo, description: ev.target.value })} className={adminInput} />
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
              <Link href={`/insights/${data.slug}`} target="_blank" className="inline-flex items-center gap-1 text-ink-900 underline underline-offset-2">
                View <ExternalLink aria-hidden className="size-3" />
              </Link>
            ) : null}
          </span>
        }
      >
        {id ? <DeleteArticleButton id={id} title={data.title} /> : null}
        {data.status === "published" ? (
          <>
            <button type="button" disabled={pending} onClick={() => submit({ status: "draft" })} className={adminButton.secondary}>
              Unpublish
            </button>
            <button type="submit" disabled={pending} className={adminButton.primary}>
              {pending ? "Saving…" : "Update article"}
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={pending} onClick={() => submit({ status: "draft" })} className={adminButton.secondary}>
              {pending ? "Saving…" : "Save draft"}
            </button>
            <button type="button" disabled={pending} onClick={() => submit({ status: "published" })} className={adminButton.primary}>
              Publish
            </button>
          </>
        )}
      </SaveBar>
    </form>
  );
}
