"use client";

import { Search } from "lucide-react";
import type { Board } from "@/lib/types";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/components/ui/Primitives";

export type QuickFilter =
  | { kind: "status"; value: Board["status"] }
  | { kind: "lighting"; value: "backlit" | "frontlit" }
  | { kind: "city"; value: string };

const QUICK: { label: string; f: QuickFilter }[] = [
  { label: "Available boards",  f: { kind: "status", value: "available" } },
  { label: "Booked boards",     f: { kind: "status", value: "booked" } },
  { label: "Damaged boards",    f: { kind: "status", value: "damaged" } },
  { label: "Under maintenance", f: { kind: "status", value: "under_maintenance" } },
  { label: "Back lit",          f: { kind: "lighting", value: "backlit" } },
  { label: "Front lit",         f: { kind: "lighting", value: "frontlit" } },
  { label: "Rajkot",            f: { kind: "city", value: "Rajkot" } },
  { label: "Junagadh",          f: { kind: "city", value: "Junagadh" } },
  { label: "Jamnagar",          f: { kind: "city", value: "Jamnagar" } },
  { label: "Jetpur",            f: { kind: "city", value: "Jetpur" } },
  { label: "Dwarka",            f: { kind: "city", value: "Dwarka" } },
];

function sameFilter(a: QuickFilter | null, b: QuickFilter) {
  return !!a && a.kind === b.kind && a.value === b.value;
}

export function SearchPanel({
  query,
  onQuery,
  active,
  onToggle,
  results,
  onSelect,
}: {
  query: string;
  onQuery: (q: string) => void;
  active: QuickFilter | null;
  onToggle: (f: QuickFilter) => void;
  results: Board[];
  onSelect: (b: Board) => void;
}) {
  const searching = query.trim().length > 0 || active !== null;

  return (
    <div className="flex h-full w-[427px] shrink-0 flex-col overflow-hidden bg-chrome">
      <div className="px-8 pb-6 pt-8">
        <h1 className="text-title2 font-[680] text-ink-0">Search</h1>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={1.9} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Road, area, city or pincode"
            className={cn(
              "h-12 w-full rounded-[var(--radius-control)] bg-chrome-raised pl-11 pr-4",
              "text-body text-ink-0 placeholder:text-ink-500",
              "ring-1 ring-chrome-line/70 ring-inset outline-none",
              "transition-shadow duration-150 focus:ring-2 focus:ring-accent",
            )}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
        {!searching ? (
          <>
            <h2 className="text-caption2 uppercase text-ink-500">Quick filters</h2>
            <div className="mt-3 flex flex-col gap-2">
              {QUICK.map(({ label, f }) => {
                const on = sameFilter(active, f);
                return (
                  <button
                    key={label}
                    onClick={() => onToggle(f)}
                    className={cn(
                      "h-12 rounded-[var(--radius-control)] px-4 text-left text-body font-[520]",
                      "ring-1 ring-inset transition-colors duration-150",
                      on
                        ? "bg-accent text-accent-on ring-transparent"
                        : "bg-chrome-raised text-ink-100 ring-chrome-line/70 hover:bg-chrome-line",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-caption2 uppercase text-ink-500">
              {results.length.toLocaleString("en-IN")} result{results.length === 1 ? "" : "s"}
            </h2>
            <div className="mt-3 flex flex-col gap-1.5">
              {results.slice(0, 200).map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelect(b)}
                  className="rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors duration-150 hover:bg-chrome-raised"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-[7px] shrink-0 rounded-full"
                      style={{ background: statusMeta(b.status).color }}
                    />
                    <span className="truncate text-subhead font-[590] text-ink-0">{b.name}</span>
                  </div>
                  <div className="mt-0.5 truncate pl-[17px] text-footnote text-ink-400">
                    {b.area}, {b.city} · {b.code}
                  </div>
                </button>
              ))}
              {results.length > 200 && (
                <p className="px-4 py-3 text-footnote text-ink-500">
                  Showing first 200. Narrow the search to see more.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
