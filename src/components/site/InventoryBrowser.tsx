"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronsLeft, Search, SlidersHorizontal, TrafficCone, X } from "lucide-react";
import { MapsProvider } from "@/components/map/MapsProvider";
import { PublicMap } from "@/components/site/PublicMap";
import { BoardVisual } from "@/components/site/BoardVisual";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { boardPhotoUrl } from "@/lib/assets";
import type { PublicBoard } from "@/lib/publicBoards";
import { inr, fullDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PANEL_W = 427;
const RATE_MAX = 150000;
const NARROW = 860;

type Size = PublicBoard["sizeCategory"];
type Light = PublicBoard["lighting"];

function lightingLabel(l: Light) {
  return l === "backlit" ? "Back-lit" : l === "frontlit" ? "Front-lit" : "Non-lit";
}

/** Reads a media query as a value rather than syncing it into state — the
 *  viewport is external, and setting state from an effect to mirror it is
 *  both a render more than needed and what the hooks lint is warning about. */
function useNarrow(px: number) {
  const query = `(max-width: ${px - 1}px)`;
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [query]);
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false, // the server has no viewport; assume the wide layout
  );
}

function Section({
  title, count, defaultOpen, children,
}: {
  title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="tmui-sec">
      <button className="tmui-sec__head" onClick={() => setOpen((v) => !v)}>
        {title}
        {!!count && <span className="tmui-sec__n">{count}</span>}
        <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} strokeWidth={2.4} />
      </button>
      {open && <div className="tmui-sec__body">{children}</div>}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className="tmui-chip" aria-pressed={on} onClick={onClick}>
      {children}
      {on && <X className="size-3" strokeWidth={3} />}
    </button>
  );
}

function BoardPanel({
  board, onBack, onMap,
}: {
  board: PublicBoard; onBack: () => void; onMap?: () => void;
}) {
  const free = board.availability === "available";
  return (
    <div className="tmui-detail">
      <BoardVisual
        lat={board.lat}
        lng={board.lng}
        photoUrl={boardPhotoUrl(board.code)}
        title={board.name}
      />

      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--hair)" }}>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onBack} className="tmui-caps inline-flex items-center gap-1.5"
                  style={{ fontSize: 11.5, fontWeight: 600 }}>
            <ArrowLeft className="size-3.5" strokeWidth={2.6} /> All billboards
          </button>
          <span className="flex items-center gap-3">
            {onMap && (
              <button onClick={onMap} className="tmui-caps" style={{ fontSize: 11.5, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}>
                Map
              </button>
            )}
            <span className="tmui-caps" style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.5 }}>{board.code}</span>
          </span>
        </div>
        <h1 className="tmui-caps mt-4" style={{ fontSize: 22, fontWeight: 700, letterSpacing: ".01em", lineHeight: 1.15 }}>
          {board.name}
        </h1>
        <p className="mt-2" style={{ fontSize: 14, opacity: 0.7 }}>{board.address}</p>
      </div>

      <dl className="tmui-kv">
        <div>
          <dt>Rate</dt>
          <dd>{inr(board.askingRate)}<span style={{ fontSize: 12, fontWeight: 500, opacity: .5 }}> /mo</span></dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{free ? "Free now" : "Booked"}</dd>
          {!free && board.freeFrom && (
            <p className="mt-1" style={{ fontSize: 12, opacity: .55 }}>opens {fullDate(board.freeFrom)}</p>
          )}
        </div>
        <div>
          <dt>Size</dt>
          <dd>{board.widthFt}×{board.heightFt} ft
            <span style={{ fontSize: 12, fontWeight: 500, opacity: .5, textTransform: "capitalize" }}> {board.sizeCategory}</span>
          </dd>
        </div>
        <div>
          <dt>Lighting</dt>
          <dd>{lightingLabel(board.lighting)}</dd>
        </div>
      </dl>

      <div className="px-5 py-6" style={{ borderTop: "1px solid var(--ink)" }}>
        <h2 className="tmui-caps" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em" }}>
          Check availability
        </h2>
        <div className="mt-4"><EnquiryForm board={board} /></div>
      </div>
    </div>
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
  const [maxRate, setMaxRate] = useState(RATE_MAX);
  const [open, setOpen] = useState<string | null>(initialBoard);
  const [traffic, setTraffic] = useState(false);

  // On a phone the rail is wider than the screen, so it stops being a rail and
  // becomes a sheet over the map — and the map, not the filters, is what you
  // should land on. So the default follows the viewport, and only a deliberate
  // toggle overrides it.
  const narrow = useNarrow(NARROW);
  const [panelOverride, setPanelOverride] = useState<boolean | null>(null);
  const panelOpen = panelOverride ?? !narrow;
  const panelW = narrow ? "100%" : PANEL_W;

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boards.filter((b) => {
      if (selectedCities.length && !selectedCities.includes(b.city)) return false;
      if (availableOnly && b.availability !== "available") return false;
      if (sizes.length && !sizes.includes(b.sizeCategory)) return false;
      if (lights.length && !lights.includes(b.lighting)) return false;
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
    (availableOnly ? 1 : 0) + (maxRate < RATE_MAX ? 1 : 0);

  function clearAll() {
    setSelectedCities([]); setAvailableOnly(false); setSizes([]); setLights([]); setMaxRate(RATE_MAX);
  }

  // Escape backs out, innermost first — same as the admin.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (board) setOpen(null);
      else if (panelOpen) setPanelOverride(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, panelOpen]);

  const showPanel = !!board || panelOpen;

  return (
    <MapsProvider>
      <div className="tmui relative h-[calc(100dvh-64px)] overflow-hidden">
        <div className="absolute inset-0">
          <PublicMap
            boards={results}
            selected={open}
            onSelect={setOpen}
            insetLeft={showPanel && !narrow ? PANEL_W + 24 : 24}
            traffic={traffic}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 flex">
          <AnimatePresence mode="wait" initial={false}>
            {showPanel && (
              <motion.div
                key={board ? "detail" : "filters"}
                initial={narrow ? { x: "-100%" } : { width: 0, opacity: 0 }}
                animate={narrow ? { x: 0 } : { width: PANEL_W, opacity: 1 }}
                exit={narrow ? { x: "-100%" } : { width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className={cn(
                  "pointer-events-auto overflow-hidden",
                  narrow ? "absolute inset-0 z-20" : "h-full shrink-0",
                )}
              >
                <div style={{ width: panelW, height: "100%" }}>
                  {board ? (
                    <BoardPanel board={board} onBack={() => setOpen(null)} onMap={narrow ? () => setOpen(null) : undefined} />
                  ) : (
                    <div className="tmui-rail">
                      <div className="tmui-rail__top">
                        <span className="tmui-caps inline-flex items-center gap-2"
                              style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em" }}>
                          <SlidersHorizontal className="size-4" strokeWidth={2.4} />
                          Filters
                          {activeCount > 0 && <span className="tmui-sec__n">{activeCount}</span>}
                        </span>
                        {activeCount > 0 && (
                          <button onClick={clearAll} className="tmui-caps"
                                  style={{ fontSize: 11.5, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}>
                            Clear
                          </button>
                        )}
                        <button onClick={() => setPanelOverride(false)} aria-label="Hide filters"
                                className="ml-auto grid size-8 place-items-center">
                          <ChevronsLeft className="size-[18px]" strokeWidth={2.4} />
                        </button>
                      </div>

                      <div className="tmui-rail__body">
                        <div className="relative py-4">
                          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" strokeWidth={2.4} style={{ opacity: .45 }} />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by road, area, city"
                            className="tmui-field"
                            style={{ paddingLeft: 42 }}
                          />
                        </div>

                        <Section title="Regions" count={selectedCities.length} defaultOpen>
                          {cities.map((c) => (
                            <Chip key={c} on={selectedCities.includes(c)} onClick={() => toggle(selectedCities, c, setSelectedCities)}>
                              {c}
                            </Chip>
                          ))}
                        </Section>

                        <Section title="Availability" count={availableOnly ? 1 : 0} defaultOpen>
                          <Chip on={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>Free right now</Chip>
                        </Section>

                        <Section title="Budget" count={maxRate < RATE_MAX ? 1 : 0} defaultOpen>
                          <div className="w-full">
                            <input
                              type="range" min={10000} max={RATE_MAX} step={5000}
                              value={maxRate} onChange={(e) => setMaxRate(Number(e.target.value))}
                              className="w-full" style={{ accentColor: "#000" }}
                            />
                            <div className="tmui-caps mt-2 flex justify-between" style={{ fontSize: 11.5, fontWeight: 600 }}>
                              <span style={{ opacity: .5 }}>₹10,000</span>
                              <span>up to {inr(maxRate)}</span>
                            </div>
                          </div>
                        </Section>

                        <Section title="Size" count={sizes.length}>
                          {(["small", "medium", "large"] as Size[]).map((s) => (
                            <Chip key={s} on={sizes.includes(s)} onClick={() => toggle(sizes, s, setSizes)}>{s}</Chip>
                          ))}
                        </Section>

                        <Section title="Lighting" count={lights.length}>
                          {(["backlit", "frontlit", "none"] as Light[]).map((l) => (
                            <Chip key={l} on={lights.includes(l)} onClick={() => toggle(lights, l, setLights)}>
                              {lightingLabel(l)}
                            </Chip>
                          ))}
                        </Section>
                      </div>

                      <div className="tmui-rail__foot">
                        {results.length.toLocaleString("en-IN")} site{results.length === 1 ? "" : "s"} match
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-none relative min-w-0 flex-1">
            {/* A map layer, not a filter — it changes nothing about which
                boards are listed, so it sits on the map rather than in the
                rail with Size and Lighting. */}
            <button
              onClick={() => setTraffic((v) => !v)}
              aria-pressed={traffic}
              className="tmui-ghost pointer-events-auto absolute right-6 top-6 z-10"
              style={traffic ? { background: "var(--ink)", color: "var(--paper)" } : { background: "#fff" }}
            >
              <TrafficCone className="size-4" strokeWidth={2.4} />
              Live traffic
            </button>

            {/* The roads borrow the same green and red the pins use for free
                and booked, which would otherwise read as one scale. Saying
                what is what costs a line and removes the ambiguity. */}
            {traffic && (
              <div
                className="tmui-caps pointer-events-none absolute right-6 top-[68px] z-10 flex flex-col gap-1.5 border p-3"
                style={{ background: "#fff", borderColor: "var(--ink)", fontSize: 10.5, fontWeight: 600 }}
              >
                <span className="flex items-center gap-2">
                  <span style={{ width: 16, height: 3, background: "#16e098" }} /> Roads flowing
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ width: 16, height: 3, background: "#e93a3a" }} /> Roads jammed
                </span>
                <span className="mt-1 flex items-center gap-2" style={{ opacity: .6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "#0f9d3a", border: "1px solid #000" }} /> Pins are boards
                </span>
              </div>
            )}

            {!showPanel && (
              <button onClick={() => setPanelOverride(true)}
                      className="tmui-ghost pointer-events-auto absolute left-6 top-6 z-10"
                      style={{ background: "#fff" }}>
                <SlidersHorizontal className="size-4" strokeWidth={2.4} />
                Filters
                {activeCount > 0 && <span className="tmui-sec__n">{activeCount}</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </MapsProvider>
  );
}
