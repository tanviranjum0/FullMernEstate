"use client";

import { useState, useTransition } from "react";
import { previewMarkdownAction } from "@/server/actions/admin";
import { a11y, adminTextarea } from "./form-kit";
import { cn } from "@/lib/utils/cn";

/** Markdown textarea with a preview rendered and sanitised by the same server function as the site. */
export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 14,
  error,
  maxLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
  maxLength: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");
  const [pending, startTransition] = useTransition();

  const showPreview = () => {
    setTab("preview");
    startTransition(async () => {
      const result = await previewMarkdownAction(value);
      setHtml(result.ok ? result.data.html : "<p>Preview unavailable.</p>");
    });
  };

  return (
    <div>
      <div role="tablist" aria-label="Editor mode" className="mb-2 flex gap-1">
        {(["write", "preview"] as const).map((mode) => (
          <button
            key={mode}
            id={`${id}-tab-${mode}`}
            type="button"
            role="tab"
            aria-selected={tab === mode}
            aria-controls={`${id}-panel`}
            onClick={() => (mode === "write" ? setTab("write") : showPreview())}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium",
              tab === mode ? "bg-ink-900 text-ivory" : "text-stone-600 hover:bg-sand-100",
            )}
          >
            {mode === "write" ? "Write" : "Preview"}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-stone-500">
          Markdown · ## headings, **bold**, lists, links
        </span>
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`}>
        {tab === "write" ? (
          <textarea
            {...a11y(id, error)}
            rows={rows}
            value={value}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
            className={`${adminTextarea} font-mono text-[0.85rem]`}
          />
        ) : (
          <div className="min-h-40 rounded-sm border border-sand-200 bg-ivory p-5">
            {pending ? (
              <p className="text-sm text-stone-600">Rendering…</p>
            ) : (
              <div className="prose-editorial" dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
