"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronsLeft, MapPin, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";
import { cn, inr, fullDate } from "@/lib/utils";
import { PublicMap } from "@/components/site/PublicMap";
import { EnquiryForm } from "@/components/site/EnquiryForm";

type Size = "small" | "medium" | "large";
type Light = "backlit" | "frontlit" | "none";

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
    <div className="border-b" style={{ borderColor: "var(--s-line-soft)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 py-4 text-left"
      >
        <span className="text-[16px] font-[600] tracking-[-0.01em]" style={{ color: "var(--s-text)" }}>
          {title}
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          strokeWidth={2.2}
          style={{ color: "var(--s-text-soft)" }}
        />
        {!!count && (
          <span
            className="ml-auto grid size-5 place-items-center rounded-full text-[11px] font-[700] text-white"
            style={{ background: "var(--s-good)" }}
          >
            {count}
          </span>
        )}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ pill option */
function Pill({
  on, onClick, children,
}: {
  on: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[14px] font-[500] transition-colors"
      style={
        on
          ? { background: "var(--s-good)", borderColor: "transparent", color: "#fff" }
          : { background: "var(--s-bg)", borderColor: "var(--s-line)", color: "var(--s-text-soft)" }
      }
    >
      {children}
      {on ? <X className="size-3.5" strokeWidth={2.6} /> : <Plus className="size-3.5" strokeWidth={2.4} />}
    </button>
  );
}

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

  return (
    <div className="site flex min-h-dvh flex-col">
      <div className="flex min-h-0 flex-1">
        {/* ------------------------------------------------- filter panel */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="shrink-0 overflow-hidden border-r"
              style={{ borderColor: "var(--s-line)", background: "var(--s-bg)" }}
            >
              <div className="flex h-[calc(100dvh-68px)] w-[380px] flex-col">
                {/* toolbar */}
                <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: "var(--s-line)" }}>
                  <span
                    className="inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[14px] font-[600]"
                    style={{ borderColor: "var(--s-line)", color: "var(--s-text)" }}
                  >
                    <SlidersHorizontal className="size-4" strokeWidth={2.2} />
                    Filters
                    {activeCount > 0 && (
                      <span
                        className="grid size-5 place-items-center rounded-full text-[11px] font-[700] text-white"
                        style={{ background: "var(--s-good)" }}
                      >
                        {activeCount}
                      </span>
                    )}
                  </span>
                  {activeCount > 0 && (
                    <button onClick={clearAll} className="text-[13px]" style={{ color: "var(--s-text-soft)" }}>
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    aria-label="Hide filters"
                    className="ml-auto grid size-8 place-items-center rounded-[8px]"
                    style={{ color: "var(--s-text-soft)" }}
                  >
                    <ChevronsLeft className="size-[18px]" strokeWidth={2.2} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5">
                  {/* search */}
                  <div className="relative py-4">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2" strokeWidth={2} style={{ color: "var(--s-text-soft)" }} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for city or road"
                      className="h-12 w-full rounded-[12px] border pl-11 pr-4 text-[15px] outline-none"
                      style={{ borderColor: "var(--s-line)", background: "var(--s-bg)", color: "var(--s-text)" }}
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
                    <Pill on={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>
                      Free right now
                    </Pill>
                  </Section>

                  <Section title="Budget" count={maxRate < 150000 ? 1 : 0} defaultOpen>
                    <input
                      type="range" min={10000} max={150000} step={5000}
                      value={maxRate}
                      onChange={(e) => setMaxRate(Number(e.target.value))}
                      className="w-full accent-[var(--s-good)]"
                    />
                    <div className="mt-2 flex justify-between text-[14px]" style={{ color: "var(--s-text-soft)" }}>
                      <span>₹10,000</span>
                      <span className="font-[600]" style={{ color: "var(--s-text)" }}>
                        up to {inr(maxRate)}
                      </span>
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

                {/* results */}
                <div className="border-t px-5 py-3.5" style={{ borderColor: "var(--s-line)", background: "var(--s-bg-soft)" }}>
                  <p className="text-[14px] font-[600] tabular-nums" style={{ color: "var(--s-text)" }}>
                    {results.length.toLocaleString("en-IN")} site{results.length === 1 ? "" : "s"} match
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ---------------------------------------------------------- map */}
        <div className="relative min-w-0 flex-1">
          <PublicMap boards={results} selected={open} onSelect={setOpen} />

          {!panelOpen && (
            <button
              onClick={() => setPanelOpen(true)}
              className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-[12px] border bg-white px-4 py-2.5 text-[14px] font-[600] shadow-sm"
              style={{ borderColor: "var(--s-line)", color: "var(--s-text)" }}
            >
              <SlidersHorizontal className="size-4" strokeWidth={2.2} />
              Filters
              {activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full text-[11px] font-[700] text-white" style={{ background: "var(--s-good)" }}>
                  {activeCount}
                </span>
              )}
            </button>
          )}

          {/* board detail sheet */}
          <AnimatePresence>
            {board && (
              <motion.aside
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
                className="absolute right-4 top-4 bottom-4 z-20 w-[400px] max-w-[calc(100%-2rem)] overflow-y-auto rounded-[18px] border bg-white shadow-[0_12px_48px_-16px_rgba(16,24,32,0.32)]"
                style={{ borderColor: "var(--s-line)" }}
              >
                <div className="flex items-start justify-between gap-3 border-b px-6 pb-5 pt-6" style={{ borderColor: "var(--s-line-soft)" }}>
                  <div className="min-w-0">
                    <span className="font-mono text-[12px]" style={{ color: "var(--s-text-soft)" }}>{board.code}</span>
                    <h2 className="mt-1 text-[22px] font-[700] leading-tight tracking-[-0.02em]" style={{ color: "var(--s-text)" }}>
                      {board.name}
                    </h2>
                    <p className="mt-1.5 flex items-start gap-1.5 text-[14px]" style={{ color: "var(--s-text-soft)" }}>
                      <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
                      {board.address}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(null)}
                    aria-label="Close"
                    className="grid size-8 shrink-0 place-items-center rounded-full"
                    style={{ background: "var(--s-bg-sunk)", color: "var(--s-text-mid)" }}
                  >
                    <X className="size-4" strokeWidth={2.2} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-5 border-b px-6 py-5" style={{ borderColor: "var(--s-line-soft)" }}>
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--s-text-soft)" }}>Rate</p>
                    <p className="mt-0.5 text-[20px] font-[700] tabular-nums" style={{ color: "var(--s-text)" }}>
                      {inr(board.askingRate)}
                      <span className="ml-1 text-[13px] font-[400]" style={{ color: "var(--s-text-soft)" }}>/mo</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--s-text-soft)" }}>Availability</p>
                    <p className="mt-0.5 text-[20px] font-[700]" style={{ color: board.availability === "available" ? "var(--s-good)" : "var(--s-text-mid)" }}>
                      {board.availability === "available" ? "Free now" : "Booked"}
                    </p>
                    {board.freeFrom && (
                      <p className="text-[12px] tabular-nums" style={{ color: "var(--s-text-soft)" }}>
                        opens {fullDate(board.freeFrom)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--s-text-soft)" }}>Size</p>
                    <p className="mt-0.5 text-[15px] font-[600] tabular-nums" style={{ color: "var(--s-text)" }}>
                      {board.widthFt}×{board.heightFt} ft
                      <span className="ml-1.5 text-[13px] font-[400] capitalize" style={{ color: "var(--s-text-soft)" }}>{board.sizeCategory}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px]" style={{ color: "var(--s-text-soft)" }}>Lighting</p>
                    <p className="mt-0.5 text-[15px] font-[600]" style={{ color: "var(--s-text)" }}>{lightingLabel(board.lighting)}</p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${board.lat},${board.lng}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[14px] font-[600]"
                    style={{ color: "var(--s-accent)" }}
                  >
                    <MapPin className="size-3.5" strokeWidth={2.2} /> See it on Google Maps
                  </a>

                  <h3 className="mt-6 text-[17px] font-[650] tracking-[-0.01em]" style={{ color: "var(--s-text)" }}>
                    Check availability
                  </h3>
                  <div className="mt-4">
                    <EnquiryForm board={board} onDone={() => setOpen(null)} />
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
