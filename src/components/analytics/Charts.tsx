"use client";

import { useState } from "react";
import { cn, inr } from "@/lib/utils";
import { MONTH_NAMES, type Counted } from "@/lib/analytics";

/**
 * Single-series magnitude over twelve months. One hue rather than a
 * categorical palette — there is only one series, so colour carries no
 * identity here and a legend would be noise. Values live in text tokens.
 */
export function MonthBars({
  values,
  height = 72,
  label = "bookings",
}: {
  values: number[];
  height?: number;
  label?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...values);

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {values.map((v, i) => {
          const h = v === 0 ? 2 : Math.max(3, Math.round((v / max) * height));
          const on = hover === i;
          return (
            <button
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${MONTH_NAMES[i]}: ${v} ${label}`}
              className="group relative flex flex-1 items-end"
              style={{ height }}
            >
              <span
                className="w-full rounded-t-[4px] transition-opacity"
                style={{
                  height: h,
                  background: v === 0 ? "var(--color-ink-700)" : "var(--accent)",
                  opacity: v === 0 ? 1 : on ? 1 : 0.82,
                }}
              />
              {on && v > 0 && (
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink-950 px-2 py-1 text-caption tabular-nums text-ink-0 ring-1 ring-white/[0.12]">
                  {MONTH_NAMES[i]} · {v}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {MONTH_NAMES.map((m, i) => (
          <span
            key={m}
            className={cn(
              "flex-1 text-center text-[9px] tabular-nums",
              hover === i ? "text-ink-200" : "text-ink-600",
            )}
          >
            {m[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Ranked horizontal bars for "where do they buy" — magnitude, one hue. */
export function RankedBars({ items, suffix }: { items: Counted[]; suffix?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <p className="text-footnote text-ink-600">No data.</p>;
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="w-[112px] shrink-0 truncate text-footnote text-ink-300">{it.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(it.count / max) * 100}%`, background: "var(--accent)" }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-footnote tabular-nums text-ink-400">
            {it.count}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-chrome-raised px-5 py-4 ring-1 ring-white/[0.07] ring-inset">
      <div className="text-caption2 uppercase text-ink-500">{label}</div>
      <div className="mt-1.5 text-title2 font-[680] tabular-nums text-ink-0">{value}</div>
      {sub && <div className="mt-0.5 text-caption tabular-nums text-ink-500">{sub}</div>}
    </div>
  );
}

export function money(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return inr(n);
}
