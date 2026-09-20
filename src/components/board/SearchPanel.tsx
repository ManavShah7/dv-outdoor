"use client";

import { Search, X } from "lucide-react";
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

/** Human-readable name for an applied filter, used on the removable chip. */
function filterLabel(f: QuickFilter) {
  if (f.kind === "city") return f.value;
  if (f.kind === "lighting") return f.value === "backlit" ? "Back lit" : "Front lit";
  return {
    available: "Available",
    booked: "Booked",
    damaged: "Damaged",
    under_maintenance: "Under maintenance",
  }[f.value];
}

export function SearchPanel({
  query,
  onQuery,
  active,
  onToggle,
  onClearFilter,
  results,
  onSelect,
  onClose,
}: {
  query: string;
  onQuery: (q: string) => void;
  active: QuickFilter | null;
  onToggle: (f: QuickFilter) => void;
  onClearFilter: () => void;
  results: Board[];
  onSelect: (b: Board) => void;
  onClose: () => void;
}) {
  const searching = query.trim().length > 0 || active !== null;

  return (
    <div className="flex h-full w-[427px] shrink-0 flex-col overflow-hidden material-thick border-r border-white/[0.06]">
      <div className="px-8 pb-6 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-title2 font-[680] text-ink-0">Search</h1>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="grid size-8 place-items-center rounded-full material-inset text-ink-400 transition-colors hover:text-ink-0"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={1.9} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Road, area, city or pincode"
            className={cn(
              "h-12 w-full rounded-[var(--radius-control)] material-inset pl-11",
              query ? "pr-11" : "pr-4",
              "text-body text-ink-0 placeholder:text-ink-500",
              "ring-1 ring-white/[0.07] ring-inset outline-none",
              "transition-shadow duration-150 focus:ring-2 focus:ring-accent",
            )}
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              aria-label="Clear search text"
              className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-ink-700 text-ink-300 transition-colors hover:text-ink-0"
            >
              <X className="size-3.5" strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* What is actually applied right now, and how to undo it. */}
        {searching && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {active && (
              <button
                onClick={onClearFilter}
                className="group inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-accent/15 py-1.5 pl-3 pr-2 text-footnote font-[590] text-accent ring-1 ring-accent/30 ring-inset transition-colors hover:bg-accent/25"
              >
                {filterLabel(active)}
                <X className="size-3.5 opacity-70 group-hover:opacity-100" strokeWidth={2.6} />
              </button>
            )}
            {query.trim() && (
              <button
                onClick={() => onQuery("")}
                className="group inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] material-inset py-1.5 pl-3 pr-2 text-footnote font-[590] text-ink-200 ring-1 ring-white/[0.08] ring-inset transition-colors hover:bg-white/[0.07]"
              >
                &ldquo;{query.trim()}&rdquo;
                <X className="size-3.5 opacity-70 group-hover:opacity-100" strokeWidth={2.6} />
              </button>
            )}
            {active && query.trim() && (
              <button
                onClick={() => { onClearFilter(); onQuery(""); }}
                className="text-footnote text-ink-500 underline-offset-2 hover:text-ink-200 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}
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
                        : "material-inset text-ink-100 ring-white/[0.07] hover:bg-white/[0.07]",
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
                  className="rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors duration-150 hover:material-inset"
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
