"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { BoardCard } from "@/components/boards/BoardCard";
import type { Board } from "@/lib/types";
import { cn, inr, fullDate } from "@/lib/utils";
import { statusMeta } from "@/components/ui/Primitives";

type SortKey = "code" | "city" | "size" | "rate" | "status" | "permit";
type Dir = "asc" | "desc";

const SIZE_RANK: Record<string, number> = { small: 0, medium: 1, large: 2 };

const FILTERS: { label: string; test: (b: Board) => boolean }[] = [
  { label: "Available",   test: (b) => b.status === "available" },
  { label: "Booked",      test: (b) => b.status === "booked" },
  { label: "Needs work",  test: (b) => b.status === "damaged" || b.status === "under_maintenance" },
  { label: "Back-lit",    test: (b) => b.lighting === "backlit" },
  { label: "Front-lit",   test: (b) => b.lighting === "frontlit" },
  { label: "Large",       test: (b) => b.sizeCategory === "large" },
];

function Th({
  label, k, sort, dir, onSort, className,
}: {
  label: string; k?: SortKey; sort: SortKey; dir: Dir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const active = k === sort;
  return (
    <th className={cn("sticky top-0 z-10 bg-chrome px-4 py-3 text-left", className)}>
      {k ? (
        <button
          onClick={() => onSort(k)}
          className={cn(
            "inline-flex items-center gap-1.5 text-caption2 uppercase transition-colors",
            active ? "text-ink-100" : "text-ink-500 hover:text-ink-200",
          )}
        >
          {label}
          <ArrowUpDown className={cn("size-3", active ? "opacity-100" : "opacity-40")} strokeWidth={2.2} />
          {active && <span className="sr-only">{dir}</span>}
        </button>
      ) : (
        <span className="text-caption2 uppercase text-ink-500">{label}</span>
      )}
    </th>
  );
}

export function BoardsView({
  boards,
  onOpen,
  onCreate,
}: {
  boards: Board[];
  onOpen: (b: Board) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<SortKey>("code");
  const [dir, setDir] = useState<Dir>("asc");

  function toggleSort(k: SortKey) {
    if (k === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir("asc"); }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = FILTERS.find((x) => x.label === active);
    const out = boards.filter((b) => {
      if (f && !f.test(b)) return false;
      if (!q) return true;
      return (
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.area.toLowerCase().includes(q) ||
        b.pincode.includes(q) ||
        (b.rental?.company.toLowerCase().includes(q) ?? false)
      );
    });
    const sign = dir === "asc" ? 1 : -1;
    return out.sort((a, b) => {
      switch (sort) {
        case "city":   return sign * (a.city.localeCompare(b.city) || a.area.localeCompare(b.area));
        case "size":   return sign * ((SIZE_RANK[a.sizeCategory ?? ""] ?? 0) - (SIZE_RANK[b.sizeCategory ?? ""] ?? 0));
        case "rate":   return sign * (a.askingRate - b.askingRate);
        case "status": return sign * a.status.localeCompare(b.status);
        case "permit": return sign * a.code.localeCompare(b.code);
        default:       return sign * a.code.localeCompare(b.code);
      }
    });
  }, [boards, query, active, sort, dir]);

  return (
    <div className="flex h-full flex-col material-thick">
      {/* controls */}
      <div className="shrink-0 px-10 pb-5 pt-9">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={1.9} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Code, road, area, city, pincode or client"
              className={cn(
                "h-11 w-full rounded-[var(--radius-control)] bg-black/30 pl-11",
                query ? "pr-11" : "pr-4",
                "text-subhead text-ink-0 placeholder:text-ink-500",
                "ring-1 ring-white/[0.08] ring-inset outline-none",
                "transition-shadow duration-150 focus:ring-2 focus:ring-accent",
              )}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-ink-300 hover:text-ink-0"
              >
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            )}
          </div>

          {/* list for scanning 650 rows, grid for looking at boards */}
          <div className="flex h-11 shrink-0 items-center gap-1 rounded-[var(--radius-control)] bg-black/30 p-1 ring-1 ring-white/[0.08] ring-inset">
            {([
              { id: "list", Icon: List, label: "List view" },
              { id: "grid", Icon: LayoutGrid, label: "Grid view" },
            ] as const).map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-label={label}
                aria-pressed={view === id}
                className={cn(
                  "grid size-[34px] place-items-center rounded-[7px] transition-colors",
                  view === id ? "bg-white/[0.12] text-ink-0" : "text-ink-400 hover:text-ink-100",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={2} />
              </button>
            ))}
          </div>

          <button
            onClick={onCreate}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-subhead font-[590] text-accent-on transition-colors hover:bg-accent-hover"
          >
            <Plus className="size-4" strokeWidth={2.6} />
            Add board
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const on = active === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActive(on ? null : f.label)}
                className={cn(
                  "h-9 rounded-[var(--radius-control)] px-4 text-footnote font-[520]",
                  "ring-1 ring-inset transition-colors duration-150",
                  on
                    ? "bg-accent text-accent-on ring-transparent"
                    : "bg-black/25 text-ink-200 ring-white/[0.08] hover:bg-white/[0.07]",
                )}
              >
                {f.label}
              </button>
            );
          })}
          <span className="ml-auto text-footnote tabular-nums text-ink-500">
            {rows.length.toLocaleString("en-IN")} of {boards.length.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* results */}
      <div className="min-h-0 flex-1 overflow-auto px-10 pb-10">
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((b) => (
              <BoardCard key={b.id} board={b} onOpen={() => onOpen(b)} />
            ))}
          </div>
        ) : (
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th label="Code"     k="code"   sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Board"                sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Location" k="city"   sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Size"     k="size"   sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Lighting"             sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Status"   k="status" sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Client"               sort={sort} dir={dir} onSort={toggleSort} />
              <Th label="Asking"   k="rate"   sort={sort} dir={dir} onSort={toggleSort} className="text-right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const m = statusMeta(b.status);
              return (
                <tr
                  key={b.id}
                  onClick={() => onOpen(b)}
                  className="cursor-pointer border-b border-white/[0.05] transition-colors hover:bg-white/[0.04]"
                >
                  <td className="border-b border-white/[0.05] px-4 py-3 font-mono text-footnote tabular-nums text-ink-400">
                    {b.code}
                  </td>
                  <td className="max-w-[260px] border-b border-white/[0.05] px-4 py-3">
                    <div className="truncate text-subhead font-[590] text-ink-0">{b.name}</div>
                  </td>
                  <td className="max-w-[280px] border-b border-white/[0.05] px-4 py-3">
                    <div className="truncate text-footnote text-ink-300">{b.area}</div>
                    <div className="truncate text-caption text-ink-500">{b.city} {b.pincode}</div>
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.05] px-4 py-3 text-footnote text-ink-300">
                    <span className="capitalize">{b.sizeCategory}</span>
                    <span className="ml-1.5 tabular-nums text-ink-500">{b.widthFt}×{b.heightFt}</span>
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.05] px-4 py-3 text-footnote capitalize text-ink-300">
                    {b.lighting === "none" ? "Non-lit" : b.lighting}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.05] px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-footnote font-[590]" style={{ color: m.color }}>
                      <span className="size-[6px] rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </span>
                  </td>
                  <td className="max-w-[200px] border-b border-white/[0.05] px-4 py-3">
                    {b.rental ? (
                      <>
                        <div className="truncate text-footnote text-ink-200">{b.rental.company}</div>
                        <div className="truncate text-caption tabular-nums text-ink-500">
                          to {fullDate(b.rental.endDate)}
                        </div>
                      </>
                    ) : (
                      <span className="text-footnote text-ink-600">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-200">
                    {inr(b.askingRate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}

        {rows.length === 0 && (
          <p className="mt-16 text-center text-subhead text-ink-500">Nothing matches that.</p>
        )}
      </div>
    </div>
  );
}
