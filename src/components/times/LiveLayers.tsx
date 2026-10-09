"use client";

import { useEffect, useRef, useState } from "react";
import { MapsProvider } from "@/components/map/MapsProvider";
import { PublicMap } from "@/components/site/PublicMap";
import { loadPopulation, type Cell } from "@/components/map/PopulationLayer";
import { loadRoads, type Way } from "@/components/map/RoadsLayer";
import type { PublicBoard } from "@/lib/publicBoards";
import type { Hotspot } from "@/lib/hotspots.db";

/**
 * The real map, on the landing page, with every layer already on.
 *
 * This is the one claim on the page a picture cannot make. A client reading
 * "we can tell you who sees this board" either believes it or does not; a
 * client who drags the map and watches live traffic move under our own pins
 * has stopped needing to be convinced.
 *
 * Three things make it safe to put a Google map in a scrolling page:
 *
 *   - Nothing loads until it is nearly in view. The map script, the 234 kB
 *     of population cells and the 212 kB of road geometry are all deferred,
 *     so a visitor who never scrolls this far costs nothing — neither
 *     bandwidth nor a Maps load against the billing account.
 *   - `cooperative` gesture handling. A one-finger drag scrolls the page
 *     past the map instead of panning it, which is the difference between
 *     an embedded map and a trap.
 *   - A fixed opening view rather than a fit to the data, so it always
 *     opens on Rajkot at the zoom where all of these layers mean something.
 */

/**
 * Junagadh, not Rajkot, and for a reason that only showed up on screen:
 * Rajkot holds 175 of the 650 sites and the generated coordinates cluster
 * them tight around the centre, so at any useful zoom the pins became a
 * wall that buried the four layers underneath — which are the whole point
 * of this section. Junagadh's 77 sit loosely enough to see through.
 */
const CITY = "Junagadh";
const VIEW = { lat: 21.5185, lng: 70.4585, zoom: 13 } as const;

export function LiveLayers({
  boards,
  hotspots,
}: {
  boards: PublicBoard[];
  hotspots: Hotspot[];
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [population, setPopulation] = useState<Cell[]>([]);
  const [roads, setRoads] = useState<Way[]>([]);
  const [touched, setTouched] = useState(false);
  const shown = boards.filter((b) => b.city === CITY);

  // "Nearly in view" is 600px of lead, which is enough for the script and
  // both datasets to land before it is actually looked at.
  useEffect(() => {
    const el = host.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
    let alive = true;
    loadPopulation().then((c) => alive && setPopulation(c)).catch(() => {});
    loadRoads().then((w) => alive && setRoads(w)).catch(() => {});
    return () => { alive = false; };
  }, [near]);

  // The "drag to explore" hint has to go once the point is made, and a drag
  // inside the map never reaches React — Google swallows it. So the frame
  // itself listens, once, for any gesture at all.
  useEffect(() => {
    const el = host.current;
    if (!el || touched) return;
    const go = () => setTouched(true);
    el.addEventListener("pointerdown", go, { once: true });
    el.addEventListener("wheel", go, { once: true, passive: true });
    return () => {
      el.removeEventListener("pointerdown", go);
      el.removeEventListener("wheel", go);
    };
  }, [touched]);

  return (
    <div ref={host} className="ed-live ed-live--map">
      {near && (
        <MapsProvider>
          <PublicMap
            boards={shown}
            selected={null}
            onSelect={() => {}}
            view={VIEW}
            gestureHandling="cooperative"
            traffic
            population={population}
            roads={roads}
            hotspots={hotspots}
          />
        </MapsProvider>
      )}
      <span className="ed-live__pill">{CITY} · live</span>
      <span className="ed-live__hint" {...(touched ? { "data-gone": "" } : {})}>
        Drag to explore
      </span>
    </div>
  );
}
