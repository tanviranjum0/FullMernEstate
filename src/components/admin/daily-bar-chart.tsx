"use client";

import { useState } from "react";

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Single-series daily bar chart: one hue, bars anchored to a shared zero baseline, 2px gaps,
 * rounded data ends, a recessive axis, per-bar hover/focus tooltips and a table alternative.
 */
export function DailyBarChart({ data, label }: { data: { day: string; count: number }[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];
  const height = 160;
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const current = active !== null ? data[active] : null;

  return (
    <figure>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-8 flex-col-reverse justify-between pb-6 text-right text-[0.68rem] text-stone-500 tabular">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 pr-2 leading-none first:translate-y-0">
              {tick}
            </span>
          ))}
        </div>
        <div className="ml-8">
          <div className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
            {ticks.map((tick) => (
              <div
                key={tick}
                aria-hidden
                className="absolute inset-x-0 border-t border-sand-200 first:border-sand-300"
                style={{ bottom: `${(tick / max) * 100}%` }}
              />
            ))}
            <ul className="absolute inset-0 flex items-end gap-[2px]" aria-label={label}>
              {data.map((point, index) => (
                <li key={point.day} className="flex h-full flex-1 items-end">
                  <button
                    type="button"
                    className="group flex h-full w-full items-end focus-visible:outline-2 focus-visible:outline-offset-1"
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    aria-label={`${dayLabel.format(new Date(point.day))}: ${point.count}`}
                  >
                    <span
                      className="block w-full rounded-t-[4px] bg-chart-1 transition-opacity group-hover:opacity-100"
                      style={{
                        height: point.count ? `${Math.max(3, (point.count / max) * 100)}%` : 0,
                        opacity: active === null || active === index ? 1 : 0.45,
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
            {current && active !== null ? (
              <div
                role="status"
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-ink-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-ivory shadow-lift"
                style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
              >
                <span className="font-semibold tabular">{current.count}</span> on {dayLabel.format(new Date(current.day))}
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex justify-between text-[0.68rem] text-stone-500">
            <span>{data[0] ? dayLabel.format(new Date(data[0].day)) : ""}</span>
            <span>{data.at(-1) ? dayLabel.format(new Date(data.at(-1)!.day)) : ""}</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex items-center justify-between text-xs text-stone-600">
        <span>
          {total} in {data.length} days
        </span>
        <details className="text-right">
          <summary className="cursor-pointer underline underline-offset-2">View as table</summary>
          <table className="mt-2 ml-auto text-left">
            <caption className="sr-only">{label}</caption>
            <thead>
              <tr>
                <th scope="col" className="pr-6 font-semibold">Day</th>
                <th scope="col" className="font-semibold">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.day}>
                  <td className="pr-6">{dayLabel.format(new Date(point.day))}</td>
                  <td className="tabular">{point.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figcaption>
    </figure>
  );
}
