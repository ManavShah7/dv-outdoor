"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronsLeft, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";
import { cn, inr, fullDate } from "@/lib/utils";
import { PublicMap } from "@/components/site/PublicMap";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { BoardVisual } from "@/components/site/BoardVisual";
import { MapsProvider } from "@/components/map/MapsProvider";

type Size = "small" | "medium" | "large";
type Light = "backlit" | "frontlit" | "none";

const PANEL_W = 427; // same slot the admin inspector occupies

function lightingLabel(l: PublicBoard["lighting"]) {
  return l === "backlit" ? "Back-lit" : l === "frontlit" ? "Front-lit" : "Non-lit";
}

/* ---------------------------------------------------- collapsible section */
function Section({
  title, count, children, defaultOpen = false,
}: {
  title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: "var(--w-hair)" }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 py-4 text-left">
        <span className="text-[16px] font-[650]" style={{ color: "var(--w-text)" }}>{title}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")}
          style={{ color: "var(--w-faint)" }} strokeWidth={2.2} />
        {!!count && (
          <span className="ml-auto grid size-5 place-items-center rounded-full bg-accent text-[11px] font-[700] text-accent-on">
            {count}
          </span>
        )}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[14px] font-[500] transition-colors"
      style={
        on
          ? { background: "var(--w-accent)", borderColor: "transparent", color: "#fff" }
          : { background: "var(--w-bg)", borderColor: "var(--w-line)", color: "var(--w-mid)" }
      }
    >
      {children}
      {on ? <X className="size-3.5" strokeWidth={2.6} /> : <Plus className="size-3.5" strokeWidth={2.4} />}
    </button>
  );
}

/* ------------------------------------------------------------ board panel */
function BoardPanel({ board, onBack }: { board: PublicBoard; onBack: () => void }) {
  const free = board.availability === "available";

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto border-r" style={{ background: "var(--w-bg)", borderColor: "var(--w-line)" }}>
      <BoardVisual lat={board.lat} lng={board.lng} />

      {/* identity */}
      <div className="border-b px-8 py-6" style={{ borderColor: "var(--w-hair)" }}>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-footnote text-ink-500 hover:text-ink-200">
            <ArrowLeft className="size-3.5" strokeWidth={2.2} /> All billboards
          </button>
          <span className="font-mono text-[12px]" style={{ color: "var(--w-faint)" }}>{board.code}</span>
        </div>
        <h1 className="mt-3 text-[24px] font-[700] tracking-[-0.02em]" style={{ color: "var(--w-text)" }}>{board.name}</h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--w-mid)" }}>{board.address}</p>
        <p className="mt-2 text-[13px] tabular-nums" style={{ color: "var(--w-faint)" }}>
          {board.lat.toFixed(6)}, {board.lng.toFixed(6)}
        </p>
      </div>

      {/* facts */}
      <div className="grid grid-cols-2 gap-5 border-b px-8 py-6" style={{ borderColor: "var(--w-hair)" }}>
        <div>
          <p className="text-[13px]" style={{ color: "var(--w-soft-text)" }}>Rate</p>
          <p className="mt-1 text-[21px] font-[700] tabular-nums" style={{ color: "var(--w-text)" }}>
            {inr(board.askingRate)}
            <span className="ml-1 text-[13px] font-normal" style={{ color: "var(--w-soft-text)" }}>/mo</span>
          </p>
        </div>
        <div>
          <p className="text-[13px]" style={{ color: "var(--w-soft-text)" }}>Availability</p>
          <p
            className="mt-1 text-[21px] font-[700]"
            style={{ color: free ? "var(--w-free)" : "var(--w-mid)" }}
          >
            {free ? "Free now" : "Booked"}
          </p>
          {board.freeFrom && (
            <p className="text-[12px] tabular-nums" style={{ color: "var(--w-faint)" }}>opens {fullDate(board.freeFrom)}</p>
          )}
        </div>
        <div>
          <p className="text-[13px]" style={{ color: "var(--w-soft-text)" }}>Size</p>
          <p className="mt-1 text-[15px] font-[600] tabular-nums" style={{ color: "var(--w-text)" }}>
            {board.widthFt}×{board.heightFt} ft
            <span className="ml-1.5 text-[13px] font-normal capitalize" style={{ color: "var(--w-soft-text)" }}>{board.sizeCategory}</span>
          </p>
        </div>
        <div>
          <p className="text-[13px]" style={{ color: "var(--w-soft-text)" }}>Lighting</p>
          <p className="mt-1 text-[15px] font-[600]" style={{ color: "var(--w-text)" }}>{lightingLabel(board.lighting)}</p>
        </div>
      </div>

      {/* enquiry */}
      <div className="px-8 py-6">
        <h2 className="text-[18px] font-[650]" style={{ color: "var(--w-text)" }}>Check availability</h2>
        <div className="mt-5">
          <EnquiryForm board={board} onDone={onBack} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ main */
export function InventoryBrowser({
  boards, cities, initialBoard, initialCity,
}: {
  boards: PublicBoard[];
  cities: string[];
  initialBoard: string | null;
  initialCity: string | null;
}) {
  const [query, setQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>(initialCity ? [initialCity] : []);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [lights, setLights] = useState<Light[]>([]);
  const [maxRate, setMaxRate] = useState(150000);
  const [panelOpen, setPanelOpen] = useState(true);
  const [open, setOpen] = useState<string | null>(initialBoard);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boards.filter((b) => {
      if (selectedCities.length && !selectedCities.includes(b.city)) return false;
      if (availableOnly && b.availability !== "available") return false;
      if (sizes.length && !sizes.includes(b.sizeCategory as Size)) return false;
      if (lights.length && !lights.includes(b.lighting as Light)) return false;
      if (b.askingRate > maxRate) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) || b.area.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) ||
        b.pincode.includes(q) || b.code.toLowerCase().includes(q)
      );
    });
  }, [boards, query, selectedCities, availableOnly, sizes, lights, maxRate]);

  const board = open ? boards.find((b) => b.code === open) ?? null : null;
  const activeCount =
    selectedCities.length + sizes.length + lights.length +
    (availableOnly ? 1 : 0) + (maxRate < 150000 ? 1 : 0);

  function clearAll() {
    setSelectedCities([]); setAvailableOnly(false); setSizes([]); setLights([]); setMaxRate(150000);
  }

  // Escape backs out, innermost first — same as the admin.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (board) setOpen(null);
      else if (panelOpen) setPanelOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, panelOpen]);

  const showPanel = !!board || panelOpen;

  return (
    <MapsProvider>
    <div className="site relative h-[calc(100dvh-68px)] overflow-hidden">
      {/* canvas */}
      <div className="absolute inset-0">
        <PublicMap
          boards={results}
          selected={open}
          onSelect={setOpen}
          insetLeft={showPanel ? PANEL_W + 24 : 24}
        />
      </div>

      {/* floating chrome */}
      <div className="pointer-events-none absolute inset-0 flex">
        <AnimatePresence mode="wait" initial={false}>
          {showPanel && (
            <motion.div
              key={board ? "detail" : "filters"}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: PANEL_W, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="pointer-events-auto h-full shrink-0 overflow-hidden"
            >
              {board ? (
                <BoardPanel board={board} onBack={() => setOpen(null)} />
              ) : (
                <div className="flex h-full w-[427px] flex-col border-r" style={{ background: "var(--w-bg)", borderColor: "var(--w-line)" }}>
                  <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: "var(--w-line)" }}>
                    <span className="inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-footnote font-[590] text-ink-100 ring-1 ring-inset ring-white/[0.1]">
                      <SlidersHorizontal className="size-4" strokeWidth={2.2} />
                      Filters
                      {activeCount > 0 && (
                        <span className="grid size-5 place-items-center rounded-full text-[11px] font-[700] text-white" style={{ background: "var(--w-accent)" }}>
                          {activeCount}
                        </span>
                      )}
                    </span>
                    {activeCount > 0 && (
                      <button onClick={clearAll} className="text-[13px]" style={{ color: "var(--w-soft-text)" }}>Clear</button>
                    )}
                    <button
                      onClick={() => setPanelOpen(false)}
                      aria-label="Hide filters"
                      className="ml-auto grid size-8 place-items-center rounded-[8px]"
                      style={{ color: "var(--w-faint)" }}
                    >
                      <ChevronsLeft className="size-[18px]" strokeWidth={2.2} />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5">
                    <div className="relative py-4">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={2} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for city or road"
                        className="h-12 w-full rounded-[var(--radius-control)] bg-black/30 pl-11 pr-4 text-subhead text-ink-0 placeholder:text-ink-600 ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <Section title="Regions" count={selectedCities.length} defaultOpen>
                      <div className="flex flex-wrap gap-2">
                        {cities.map((c) => (
                          <Pill key={c} on={selectedCities.includes(c)} onClick={() => toggle(selectedCities, c, setSelectedCities)}>
                            {c}
                          </Pill>
                        ))}
                      </div>
                    </Section>

                    <Section title="Availability" count={availableOnly ? 1 : 0} defaultOpen>
                      <Pill on={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>Free right now</Pill>
                    </Section>

                    <Section title="Budget" count={maxRate < 150000 ? 1 : 0} defaultOpen>
                      <input
                        type="range" min={10000} max={150000} step={5000}
                        value={maxRate} onChange={(e) => setMaxRate(Number(e.target.value))}
                        className="w-full" style={{ accentColor: "var(--w-accent)" }}
                      />
                      <div className="mt-2 flex justify-between text-[13px]" style={{ color: "var(--w-soft-text)" }}>
                        <span>₹10,000</span>
                        <span className="font-[650]" style={{ color: "var(--w-text)" }}>up to {inr(maxRate)}</span>
                      </div>
                    </Section>

                    <Section title="Size" count={sizes.length}>
                      <div className="flex flex-wrap gap-2">
                        {(["small", "medium", "large"] as Size[]).map((s) => (
                          <Pill key={s} on={sizes.includes(s)} onClick={() => toggle(sizes, s, setSizes)}>
                            <span className="capitalize">{s}</span>
                          </Pill>
                        ))}
                      </div>
                    </Section>

                    <Section title="Lighting" count={lights.length}>
                      <div className="flex flex-wrap gap-2">
                        {(["backlit", "frontlit", "none"] as Light[]).map((l) => (
                          <Pill key={l} on={lights.includes(l)} onClick={() => toggle(lights, l, setLights)}>
                            {lightingLabel(l)}
                          </Pill>
                        ))}
                      </div>
                    </Section>
                  </div>

                  <div className="border-t px-5 py-3.5" style={{ borderColor: "var(--w-line)", background: "var(--w-soft)" }}>
                    <p className="text-[14px] font-[600] tabular-nums" style={{ color: "var(--w-text)" }}>
                      {results.length.toLocaleString("en-IN")} site{results.length === 1 ? "" : "s"} match
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none relative min-w-0 flex-1">
          {!showPanel && (
            <button
              onClick={() => setPanelOpen(true)}
              className="pointer-events-auto absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5 text-[14px] font-[600] shadow-sm"
              style={{ borderColor: "var(--w-line)", color: "var(--w-text)" }}
            >
              <SlidersHorizontal className="size-4" strokeWidth={2.2} />
              Filters
              {activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full text-[11px] font-[700] text-white" style={{ background: "var(--w-accent)" }}>
                  {activeCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
    </MapsProvider>
  );
}
