"use client";

import { useMemo, useState } from "react";
import { ImageOff, Search, X } from "lucide-react";
import type { Board } from "@/lib/types";
import type { MaintenanceRequest, Severity } from "@/lib/mockMaintenance";
import { cn, inr } from "@/lib/utils";

export const SEV: Record<Severity, { label: string; color: string }> = {
  red:    { label: "High Urgency", color: "var(--color-sev-red)" },
  orange: { label: "Urgent",       color: "var(--color-sev-orange)" },
  yellow: { label: "Low Priority", color: "var(--color-sev-yellow)" },
};

const ORDER: Severity[] = ["red", "orange", "yellow"];

const STATUS_LABEL: Record<Board["status"], { text: string; color: string }> = {
  available:         { text: "Available",         color: "var(--color-available)" },
  booked:            { text: "Booked",            color: "var(--color-booked)" },
  under_maintenance: { text: "Under Maintenance", color: "var(--color-maintenance)" },
  damaged:           { text: "Damaged",           color: "var(--color-damaged)" },
};

type Filter =
  | { kind: "status"; value: Board["status"] }
  | { kind: "city"; value: string };

const FILTERS: { label: string; f: Filter }[] = [
  { label: "Available",         f: { kind: "status", value: "available" } },
  { label: "Booked",            f: { kind: "status", value: "booked" } },
  { label: "Damaged",           f: { kind: "status", value: "damaged" } },
  { label: "Under Maintenance", f: { kind: "status", value: "under_maintenance" } },
  { label: "Rajkot",            f: { kind: "city", value: "Rajkot" } },
  { label: "Junagadh",          f: { kind: "city", value: "Junagadh" } },
  { label: "Jamnagar",          f: { kind: "city", value: "Jamnagar" } },
  { label: "Dwarka",            f: { kind: "city", value: "Dwarka" } },
];

function timeAgo(iso: string) {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function lightingLabel(l: Board["lighting"]) {
  return l === "backlit" ? "Back-Lit" : l === "frontlit" ? "Front-Lit" : "Non-Lit";
}

/* ------------------------------------------------------------------- card */
function RequestCard({
  request,
  board,
  onOpen,
}: {
  request: MaintenanceRequest;
  board: Board;
  onOpen: () => void;
}) {
  const status = STATUS_LABEL[board.status];
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-chrome-raised ring-1 ring-white/[0.07] ring-inset">
      <div className="relative grid aspect-[16/10] place-items-center bg-black/35">
        <ImageOff className="size-6 text-ink-600" strokeWidth={1.5} />
        {request.wasRentedAtReport && (
          <span
            className="absolute left-3 top-3 rounded-[var(--radius-pill)] px-2 py-1 text-caption font-[620] tabular-nums"
            style={{
              color: SEV[request.aiSeverity].color,
              background: `color-mix(in srgb, ${SEV[request.aiSeverity].color} 18%, #0b0e10 82%)`,
            }}
          >
            {inr(request.revenueAtRisk)}/day
          </span>
        )}
        <span className="absolute right-3 top-3 text-caption tabular-nums text-ink-400">
          {timeAgo(request.reportedAt)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-subhead font-[590] text-ink-0">{board.name}</h3>
        <p className="mt-0.5 truncate text-footnote text-ink-400">{board.address}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote">
          <span className="font-[590]" style={{ color: status.color }}>{status.text}</span>
          <span className="text-ink-400">
            <span className="capitalize">{board.sizeCategory}</span> ({board.widthFt}*{board.heightFt})
          </span>
          <span className="text-ink-400">{lightingLabel(board.lighting)}</span>
        </div>

        <p className="mt-2.5 line-clamp-2 text-footnote text-ink-300">{request.description}</p>

        <div className="mt-auto pt-4">
          <button
            onClick={onOpen}
            className="h-10 w-full rounded-[var(--radius-control)] text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.12] ring-inset transition-colors hover:bg-white/[0.07] hover:text-ink-0"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------- view */
export function MaintenanceView({
  requests,
  boards,
  onOpen,
}: {
  requests: MaintenanceRequest[];
  boards: Board[];
  onOpen: (r: MaintenanceRequest) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Filter | null>(null);

  const boardById = useMemo(() => new Map(boards.map((b) => [b.id, b])), [boards]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const open = requests.filter((r) => {
      const b = boardById.get(r.boardId);
      if (!b) return false;
      if (r.status === "resolved") return false;
      if (active?.kind === "status" && b.status !== active.value) return false;
      if (active?.kind === "city" && b.city !== active.value) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
    return ORDER.map((sev) => ({
      sev,
      items: open
        .filter((r) => r.aiSeverity === sev)
        .sort((a, b) => b.aiUrgencyScore - a.aiUrgencyScore),
    })).filter((g) => g.items.length > 0);
  }, [requests, boardById, query, active]);

  const total = grouped.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="h-full overflow-y-auto material-thick">
      <div className="mx-auto max-w-[1400px] px-10 py-9">
        {/* controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={1.9} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
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
          <span className="text-footnote tabular-nums text-ink-500">
            {total} open
          </span>
        </div>

        {/* filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map(({ label, f }) => {
            const on = active?.kind === f.kind && active.value === f.value;
            return (
              <button
                key={label}
                onClick={() => setActive(on ? null : f)}
                className={cn(
                  "h-9 rounded-[var(--radius-control)] px-4 text-footnote font-[520]",
                  "ring-1 ring-inset transition-colors duration-150",
                  on
                    ? "bg-accent text-accent-on ring-transparent"
                    : "bg-black/25 text-ink-200 ring-white/[0.08] hover:bg-white/[0.07]",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* severity sections */}
        {grouped.length === 0 ? (
          <p className="mt-16 text-center text-subhead text-ink-500">
            Nothing matches that.
          </p>
        ) : (
          grouped.map(({ sev, items }) => (
            <section key={sev} className="mt-10">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full" style={{ background: SEV[sev].color }} />
                <h2 className="text-title3 font-[620] text-ink-0">{SEV[sev].label}</h2>
                <span className="text-footnote tabular-nums text-ink-500">{items.length}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    board={boardById.get(r.boardId)!}
                    onOpen={() => onOpen(r)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
