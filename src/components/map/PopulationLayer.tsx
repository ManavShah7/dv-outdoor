"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { assetUrl } from "@/lib/assets";

/**
 * Population density as 400m H3 hexagons, drawn over whichever map is above
 * it in the tree.
 *
 * This used to live inside the landing page's LiveHeatmap. The inventory map
 * needs the same layer next to live traffic — the two answer the same
 * question from opposite ends, how many people are near the board and how
 * many of them are moving — so it moved here and both mount it.
 *
 * Kontur's data (GHSL + Meta settlements + Microsoft footprints), CC BY, so
 * the credit the callers print is an obligation, not decoration. All 56,948
 * cells are ~234 KB, which is why the whole region is fetched once rather
 * than a city at a time — panning should not cost another request.
 */

export type Cell = [string, number];

/** Warm ramp, transparent through amber to a deep red. */
const STOPS: [number, [number, number, number]][] = [
  [0.0, [255, 244, 190]],
  [0.45, [255, 170, 60]],
  [0.75, [235, 70, 45]],
  [1.0, [140, 10, 30]],
];

function ramp(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i];
    const [b, cb] = STOPS[i + 1];
    if (x >= a && x <= b) {
      const f = b === a ? 0 : (x - a) / (b - a);
      return [
        Math.round(ca[0] + (cb[0] - ca[0]) * f),
        Math.round(ca[1] + (cb[1] - ca[1]) * f),
        Math.round(ca[2] + (cb[2] - ca[2]) * f),
      ];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/** Fetches the region once per page and shares it between mounts. */
let cache: Promise<Cell[]> | null = null;
export function loadPopulation(): Promise<Cell[]> {
  cache ??= fetch(assetUrl("data/pop-saurashtra.json"))
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { cells: Cell[] }) => d.cells)
    .catch((e) => {
      cache = null; // a failed load should not poison the next attempt
      throw e;
    });
  return cache;
}

/**
 * How much of the fill survives at a given zoom.
 *
 * A 400m hexagon is a sensible unit for a city and a useless one for a
 * street: by z16 a single cell covers most of the viewport, and the layer
 * stops being a map and becomes a sheet of red over the roads. So the fill
 * fades out on the way in and the cell outline fades in to replace it —
 * you can still see which cell the board sits in and how dense it is, with
 * the street legible underneath.
 */
function fade(zoom: number) {
  const t = Math.min(1, Math.max(0, (zoom - 14) / 3)); // 14 → 17
  // The floor is deliberately not near zero: at street zoom the tint is the
  // only thing still saying "this is a dense block", and a first pass that
  // faded to 20% left the layer switched on and apparently doing nothing.
  return { fill: 1 - 0.55 * t, line: t };
}

export function PopulationLayer({
  cells,
  /** Dialled down where the hexagons sit under pins that must stay readable. */
  opacity = 1,
}: {
  cells: Cell[];
  opacity?: number;
}) {
  const map = useMap();
  // The zoom lives on the Google map, not in React. Mirroring it into state
  // from an effect is a render more than needed and is what the hooks lint
  // objects to, so it is read as the external value it is.
  const subscribe = useCallback((cb: () => void) => {
    if (!map) return () => {};
    const l = map.addListener("zoom_changed", cb);
    return () => l.remove();
  }, [map]);
  const zoom = useSyncExternalStore(
    subscribe,
    () => map?.getZoom() ?? 12,
    () => 12, // the server has no map
  );

  // One overlay for the life of the component. Creating it inside the effect
  // meant StrictMode's mount/unmount/mount tore it down while Google was
  // still queuing onAdd, and deck then called addListener on a null map.
  const [overlay] = useState(() => new GoogleMapsOverlay({ interleaved: false }));

  useEffect(() => {
    if (!map) return;
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, overlay]);


  // Depends on the overlay too: the data usually lands before the map does,
  // and keying only on `cells` meant the layer was set on nothing and never
  // set again.
  useEffect(() => {
    // Switching the layer off hands back an empty array, and returning early
    // on it left the last frame of hexagons painted over a map that no longer
    // claimed to be showing them.
    if (!cells.length) { overlay.setProps({ layers: [] }); return; }
    // Scale against a high percentile rather than the single densest cell —
    // one outlier hex would otherwise flatten every city to pale yellow.
    const sorted = cells.map((c) => c[1]).sort((a, b) => a - b);
    const peak = sorted[Math.floor(sorted.length * 0.995)] || 1;
    const { fill, line } = fade(zoom);

    overlay.setProps({
      layers: [
        new H3HexagonLayer<Cell>({
          id: "population",
          data: cells,
          getHexagon: (d) => d[0],
          extruded: false,
          filled: true,
          stroked: line > 0.02,
          highPrecision: false,
          pickable: false,
          lineWidthMinPixels: 1,
          getFillColor: (d) => {
            const t = Math.pow(Math.min(1, d[1] / peak), 0.55);
            const [r, g, b] = ramp(t);
            return [r, g, b, Math.round((40 + 165 * t) * opacity * fill)];
          },
          getLineColor: (d) => {
            const t = Math.pow(Math.min(1, d[1] / peak), 0.55);
            const [r, g, b] = ramp(t);
            return [r, g, b, Math.round(200 * opacity * line)];
          },
          updateTriggers: { getFillColor: [opacity, fill], getLineColor: [opacity, line] },
        }),
      ],
    });
  }, [overlay, cells, opacity, zoom]);

  return null;
}
