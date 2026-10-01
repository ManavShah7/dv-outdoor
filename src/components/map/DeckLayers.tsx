"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { PathLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";
import type { Cell } from "@/components/map/PopulationLayer";
import type { Way } from "@/components/map/RoadsLayer";

/**
 * One deck.gl overlay for every data layer on the map.
 *
 * Mounting PopulationLayer and RoadsLayer as separate GoogleMapsOverlays
 * worked, but gave the map two WebGL contexts and left their draw order up
 * to DOM order — which is not something to leave to chance when one layer is
 * a filled wash and the other is lines that have to sit on top of it. One
 * overlay, one context, and the array below is the z-order.
 */

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

/**
 * How much of the population fill survives at a given zoom.
 *
 * A 400m hexagon is a sensible unit for a city and a useless one for a
 * street: by z16 a single cell covers most of the viewport, and the layer
 * stops being a map and becomes a sheet of red over the roads. The fill
 * fades out on the way in and the cell outline fades in to replace it. The
 * floor is deliberately not near zero — a first pass that faded to 20% left
 * the layer switched on and apparently doing nothing.
 */
function fade(zoom: number) {
  const t = Math.min(1, Math.max(0, (zoom - 14) / 3)); // 14 → 17
  return { fill: 1 - 0.55 * t, line: t };
}

/** motorway, trunk, primary, secondary — the order the roads file uses. */
const ROAD_COLOUR: [number, number, number][] = [
  [10, 10, 10],
  [26, 26, 26],
  [64, 64, 64],
  [120, 120, 120],
];
/** Metres, so a trunk road stays a trunk road at every zoom. */
const ROAD_WIDTH = [34, 28, 20, 13];

export function DeckLayers({
  population = [],
  roads = [],
  /** Dialled down because the hexagons sit under pins that must stay readable. */
  populationOpacity = 0.8,
}: {
  population?: Cell[];
  roads?: Way[];
  populationOpacity?: number;
}) {
  const map = useMap();
  // One overlay for the life of the component. Creating it inside the effect
  // meant StrictMode's mount/unmount/mount tore it down while Google was
  // still queuing onAdd, and deck then called addListener on a null map.
  const [overlay] = useState(() => new GoogleMapsOverlay({ interleaved: false }));

  // The zoom lives on the Google map, not in React, so it is read as the
  // external value it is rather than mirrored into state from an effect.
  const subscribe = useCallback((cb: () => void) => {
    if (!map) return () => {};
    const l = map.addListener("zoom_changed", cb);
    return () => l.remove();
  }, [map]);
  const zoom = useSyncExternalStore(subscribe, () => map?.getZoom() ?? 12, () => 12);

  useEffect(() => {
    if (!map) return;
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, overlay]);

  useEffect(() => {
    const layers: Layer[] = [];

    if (population.length) {
      // Scale against a high percentile rather than the single densest cell —
      // one outlier hex would otherwise flatten every city to pale yellow.
      const sorted = population.map((c) => c[1]).sort((a, b) => a - b);
      const peak = sorted[Math.floor(sorted.length * 0.995)] || 1;
      const { fill, line } = fade(zoom);

      layers.push(
        new H3HexagonLayer<Cell>({
          id: "population",
          data: population,
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
            return [r, g, b, Math.round((40 + 165 * t) * populationOpacity * fill)];
          },
          getLineColor: (d) => {
            const t = Math.pow(Math.min(1, d[1] / peak), 0.55);
            const [r, g, b] = ramp(t);
            return [r, g, b, Math.round(200 * populationOpacity * line)];
          },
          updateTriggers: {
            getFillColor: [populationOpacity, fill],
            getLineColor: [populationOpacity, line],
          },
        }),
      );
    }

    if (roads.length) {
      /* Thinned by zoom, because the whole region at once is a scribble.
         Below z9 only motorways and trunk roads — the corridors between
         towns; by z13 everything, which is when you are looking at one
         town's grid. */
      const floor = zoom < 9 ? 2 : zoom < 11 ? 3 : 4;
      const shown = roads.filter((w) => w[0] < floor);

      layers.push(
        new PathLayer<Way>({
          id: "roads",
          data: shown,
          // the file stores flat [lat,lng,lat,lng,…]; deck wants [lng,lat]
          getPath: (w) => {
            const out: [number, number][] = [];
            for (let i = 0; i < w[1].length; i += 2) out.push([w[1][i + 1], w[1][i]]);
            return out;
          },
          getColor: (w) => [...ROAD_COLOUR[w[0]], 150] as [number, number, number, number],
          getWidth: (w) => ROAD_WIDTH[w[0]],
          widthUnits: "meters",
          widthMinPixels: 1.2,
          widthMaxPixels: 14,
          capRounded: true,
          jointRounded: true,
          pickable: false,
          updateTriggers: { getPath: shown.length },
        }),
      );
    }

    overlay.setProps({ layers });
  }, [overlay, population, roads, populationOpacity, zoom]);

  return null;
}
