"use client";

import { assetUrl } from "@/lib/assets";

/**
 * Population density as 400m H3 hexagons — the data side of it. The drawing
 * lives in DeckLayers, which owns the one overlay every data layer shares.
 *
 * Kontur's data (GHSL + Meta settlements + Microsoft building footprints),
 * CC BY, so the credit the callers print is an obligation, not decoration.
 * All 56,948 cells are ~234 kB, which is why the whole region is fetched
 * once rather than a city at a time — panning should not cost a request.
 */

export type Cell = [string, number];

/** Fetched once per page and shared between everything that mounts it. */
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
