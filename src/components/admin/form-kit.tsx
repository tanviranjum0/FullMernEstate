"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const adminInput =
  "h-10 w-full rounded-sm border border-sand-300 bg-white px-3 text-sm text-ink-900 placeholder:text-stone-400 focus:border-ink-800 focus:outline-none focus:ring-2 focus:ring-harbour-200 aria-[invalid=true]:border-danger-600";
export const adminTextarea =
  "w-full rounded-sm border border-sand-300 bg-white px-3 py-2 text-sm leading-relaxed text-ink-900 placeholder:text-stone-400 focus:border-ink-800 focus:outline-none focus:ring-2 focus:ring-harbour-200 aria-[invalid=true]:border-danger-600";

export function AdminField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-stone-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function a11y(id: string, error?: string, hint?: string) {
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

export function Toggle({
  id,
  label,
  checked,
  onChange,
  description,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-ink-900"
      />
      <span>
        <span className="block text-sm text-ink-900">{label}</span>
        {description ? <span className="block text-xs text-stone-500">{description}</span> : null}
      </span>
    </label>
  );
}

/** Comma-separated text input bound to a string array. */
export function ListInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join(", "));
  return (
    <input
      id={id}
      value={text}
      placeholder={placeholder}
      onChange={(event) => {
        setText(event.target.value);
        onChange(
          event.target.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        );
      }}
      className={adminInput}
    />
  );
}

/** Generic ordered list editor for structured rows (FAQs, highlights, testimonials…). */
export function Repeater<T>({
  items,
  onChange,
  create,
  render,
  addLabel,
  max = 30,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel: string;
  max?: number;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };
  // "Add question" → "question 2", so each row control has a distinct accessible name.
  const noun = addLabel.replace(/^add\s+/i, "");
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-3 rounded-sm border border-sand-200 p-3">
          <div className="min-w-0 flex-1 space-y-2">
            {render(
              item,
              (patch) =>
                onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row))),
              index,
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              aria-label={`Move ${noun} ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
              className="grid size-7 place-items-center rounded-xs text-stone-600 hover:bg-sand-100 disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Move ${noun} ${index + 1} down`}
              disabled={index === items.length - 1}
              onClick={() => move(index, index + 1)}
              className="grid size-7 place-items-center rounded-xs text-stone-600 hover:bg-sand-100 disabled:opacity-30"
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${noun} ${index + 1}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="grid size-7 place-items-center rounded-xs text-stone-600 hover:bg-danger-50 hover:text-danger-600"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      {items.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...items, create()])}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-dashed border-sand-300 px-3 text-sm text-stone-700 hover:border-ink-900 hover:text-ink-900"
        >
          <Plus aria-hidden className="size-4" /> {addLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Sticky footer carrying form-level status and the primary actions. */
export function SaveBar({
  status,
  error,
  children,
}: {
  status?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-bottom-bar
      className="sticky bottom-0 z-20 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8"
    >
      <div className="min-w-0 text-sm">
        {error ? (
          <p role="alert" className="text-danger-600">
            {error}
          </p>
        ) : (
          <p role="status" className="text-stone-600">
            {status}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const adminButton = {
  primary:
    "inline-flex h-9 items-center gap-2 rounded-sm bg-ink-900 px-4 text-sm font-medium text-ivory transition-colors hover:bg-harbour-800 disabled:opacity-50",
  secondary:
    "inline-flex h-9 items-center gap-2 rounded-sm border border-sand-300 bg-white px-4 text-sm font-medium text-ink-900 transition-colors hover:border-ink-900 disabled:opacity-50",
  danger:
    "inline-flex h-9 items-center gap-2 rounded-sm px-4 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-50",
};
