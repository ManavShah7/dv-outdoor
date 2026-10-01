"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronsLeft, Flame, MapPin, Moon, Route, Search, SlidersHorizontal, TrafficCone, X } from "lucide-react";
import { MapsProvider } from "@/components/map/MapsProvider";
import { PublicMap } from "@/components/site/PublicMap";
import { loadPopulation, type Cell } from "@/components/map/PopulationLayer";
import { loadRoads, type Way } from "@/components/map/RoadsLayer";
import { BoardVisual } from "@/components/site/BoardVisual";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { boardPhotoUrl } from "@/lib/assets";
import type { PublicBoard } from "@/lib/publicBoards";
import type { Hotspot } from "@/lib/hotspots.db";
import { isEvidenced, type Visibility } from "@/lib/visibility";
import { inr, fullDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PANEL_W = 427;

/**
 * The layer stack, and where each layer's data actually comes from.
 *
 * Naming the source in the control is the point of it. A client's next
 * question after "how many people see this board" is "says who", and five
 * named sources — one of them a satellite — answer it before it is asked.
 * It is also a licence term for two of them.
 */
type LayerState = {
  traffic: boolean; heat: boolean; roadsOn: boolean; places: boolean; night: boolean;
};
type LayerSetters = {
  setTraffic: Toggle; setHeat: Toggle; setRoadsOn: Toggle; setPlaces: Toggle; setNight: Toggle;
};
type Toggle = (f: (v: boolean) => boolean) => void;
const flip = (f: Toggle) => f((v) => !v);

const LAYERS: {
  id: string; label: string; source: string;
  Icon: typeof TrafficCone;
  get: (s: LayerState) => boolean;
  set: (s: LayerSetters) => void;
}[] = [
  { id: "traffic",  label: "Live traffic",  source: "Google",
    Icon: TrafficCone, get: (s) => s.traffic,  set: (s) => flip(s.setTraffic) },
  { id: "roads",    label: "Major roads",   source: "OpenStreetMap",
    Icon: Route,       get: (s) => s.roadsOn,  set: (s) => flip(s.setRoadsOn) },
  { id: "pop",      label: "Population",    source: "Kontur · CC BY",
    Icon: Flame,       get: (s) => s.heat,     set: (s) => flip(s.setHeat) },
  { id: "night",    label: "Night lights",  source: "NASA VIIRS",
    Icon: Moon,        get: (s) => s.night,    set: (s) => flip(s.setNight) },
  { id: "places",   label: "Landmarks",     source: "OpenStreetMap",
    Icon: MapPin,      get: (s) => s.places,   set: (s) => flip(s.setPlaces) },
];
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

const ROAD_LABEL: Record<string, string> = {
  motorway: "National highway",
  trunk: "Trunk road",
  primary: "Primary road",
  secondary: "Secondary road",
};

/**
 * What we can evidence about this site, with the source named on every line.
 *
 * Shown only when `isEvidenced` passes, so nobody is ever told a board is
 * worth 0 — where the open data has nothing to say about a site, this block
 * is simply absent and the rest of the panel stands on its own.
 */
function Evidence({ v }: { v: Visibility }) {
  const rows: { k: string; val: string; src: string }[] = [];

  if (v.roadClass) {
    rows.push({
      k: v.roadName ?? ROAD_LABEL[v.roadClass],
      val: v.roadName ? ROAD_LABEL[v.roadClass] : `${v.roadDistanceM} m away`,
      src: "OpenStreetMap",
    });
  }
  rows.push({
    k: "People within 1 km",
    val: v.people1km.toLocaleString("en-IN"),
    src: "Kontur",
  });
  if (v.landmarkCount) {
    rows.push({
      k: v.landmarkCount === 1 ? "1 landmark in reach" : `${v.landmarkCount} landmarks in reach`,
      val: v.landmarkTop.map((l) => l.name).slice(0, 2).join(", "),
      src: "OpenStreetMap",
    });
  }
  rows.push({
    k: "Lit at night",
    val: `brighter than ${v.nightPercentile}% of our sites`,
    src: "NASA VIIRS",
  });

  return (
    <div className="tmui-ev">
      <div className="tmui-ev__head">
        <span className="tmui-caps tmui-ev__title">Why this site</span>
        <span className="tmui-ev__score tabular-nums">{v.score}<i>/100</i></span>
      </div>
      <dl className="tmui-ev__list">
        {rows.map((r) => (
          <div key={r.k}>
            <dt>{r.k}</dt>
            <dd>
              {r.val}
              <span className="tmui-ev__src">{r.src}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BoardPanel({
  board, visibility, onBack, onMap,
}: {
  board: PublicBoard; visibility?: Visibility;
  onBack: () => void; onMap?: () => void;
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

      {visibility && isEvidenced(visibility) && <Evidence v={visibility} />}

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
  boards, cities, initialBoard, initialCity, hotspots = [], visibility = new Map(),
}: {
  boards: PublicBoard[];
  cities: string[];
  initialBoard: string | null;
  initialCity: string | null;
  hotspots?: Hotspot[];
  /** by board code; empty until the scoring script has been run */
  visibility?: Map<string, Visibility>;
}) {
  const [query, setQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>(initialCity ? [initialCity] : []);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [lights, setLights] = useState<Light[]>([]);
  const [maxRate, setMaxRate] = useState(RATE_MAX);
  const [open, setOpen] = useState<string | null>(initialBoard);
  const [traffic, setTraffic] = useState(false);
  const [heat, setHeat] = useState(false);
  const [roadsOn, setRoadsOn] = useState(false);
  const [night, setNight] = useState(false);
  // The night layer takes itself off the map past the zoom where 463m pixels
  // still mean anything; without saying so the toggle just looks broken.
  const [nightShown, setNightShown] = useState(true);
  // Neither file is worth fetching for the people who never open the layer,
  // so each is pulled on its first switch-on and kept after that.
  const [population, setPopulation] = useState<Cell[]>([]);
  const [roads, setRoads] = useState<Way[]>([]);

  useEffect(() => {
    if (!heat || population.length) return;
    let alive = true;
    loadPopulation().then((c) => alive && setPopulation(c)).catch(() => {});
    return () => { alive = false; };
  }, [heat, population.length]);

  useEffect(() => {
    if (!roadsOn || roads.length) return;
    let alive = true;
    loadRoads().then((w) => alive && setRoads(w)).catch(() => {});
    return () => { alive = false; };
  }, [roadsOn, roads.length]);
  // context is on by default — it is the thing that explains the boards
  const [places, setPlaces] = useState(true);

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
            population={heat ? population : []}
            roads={roadsOn ? roads : []}
            night={night}
            onNightShownChange={setNightShown}
            hotspots={places ? hotspots : []}
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
                    <BoardPanel board={board} visibility={visibility.get(board.code)}
                                onBack={() => setOpen(null)} onMap={narrow ? () => setOpen(null) : undefined} />
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
            {/* Layers, not filters: none of them changes which boards are
                listed, so they sit on the map rather than in the rail with
                Size and Lighting. Five of them is too many to stack as
                loose buttons, so they are one block with one hairline
                between each — and each one names where its data comes from,
                because a client's next question is always "says who". */}
            <div className="tmui-layers pointer-events-auto absolute right-6 top-6 z-10">
              {LAYERS.map((l) => {
                const on = l.get({ traffic, heat, roadsOn, places, night });
                return (
                  <button key={l.id} onClick={() => l.set({ setTraffic, setHeat, setRoadsOn, setPlaces, setNight })}
                          aria-pressed={on} className="tmui-layers__row" data-on={on || undefined}>
                    <l.Icon className="size-4 shrink-0" strokeWidth={2.4} />
                    <span className="tmui-layers__name">{l.label}</span>
                    <span className="tmui-layers__src">{l.source}</span>
                  </button>
                );
              })}

              {/* The key lives inside the same block rather than floating
                  under it. Absolutely positioned below a stack whose height
                  depends on how many layers exist, it collided with the
                  fifth row the moment a fifth layer was added. */}
              {(traffic || heat || roadsOn || night) && (
                <div className="tmui-layers__key tmui-caps">

                  {/* Google's traffic borrows the same green and red the pins
                      use for free and booked, which would otherwise read as
                      one scale. Saying what is what removes the ambiguity. */}
                  {traffic && (
                  <>
                    <span className="flex items-center gap-2">
                      <span style={{ width: 16, height: 3, background: "#16e098" }} /> Roads flowing
                    </span>
                    <span className="flex items-center gap-2">
                      <span style={{ width: 16, height: 3, background: "#e93a3a" }} /> Roads jammed
                    </span>
                  </>
                )}
                {heat && (
                  <span className="flex items-center gap-2">
                    <span style={{ width: 44, height: 7, background: "linear-gradient(90deg,#fff4be,#ffaa3c,#eb462d,#8c0a1e)" }} />
                    People per 400m
                  </span>
                )}
                {roadsOn && (
                  <>
                    <span className="flex items-center gap-2">
                      <span style={{ width: 20, height: 5, background: "#1a1a1a" }} /> Trunk road
                    </span>
                    <span className="flex items-center gap-2">
                      <span style={{ width: 20, height: 3.5, background: "#404040" }} /> Primary
                    </span>
                    <span className="flex items-center gap-2">
                      <span style={{ width: 20, height: 2.5, background: "#787878" }} /> Secondary
                    </span>
                  </>
                )}
                {night && (nightShown ? (
                  <span className="flex items-center gap-2">
                    <span style={{ width: 20, height: 7, background: "linear-gradient(90deg,#10142b,#f2c14e,#fff6d0)" }} />
                    Light emitted at night
                  </span>
                ) : (
                  <span style={{ opacity: .6, fontWeight: 500, lineHeight: 1.35 }}>
                    Night lights are 463&nbsp;m per pixel — zoom out to see them
                  </span>
                ))}
                  <span className="mt-0.5 flex items-center gap-2" style={{ opacity: .6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 999, background: "#0f9d3a", border: "1px solid #000" }} /> Pins are boards
                  </span>
                </div>
              )}
            </div>

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
