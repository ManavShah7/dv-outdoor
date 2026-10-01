"use client";

import { assetUrl } from "@/lib/assets";

/**
 * Saurashtra's major road network — the data side of it. The drawing lives
 * in DeckLayers.
 *
 * Of everything on this map this is the layer that most directly answers
 * what a hoarding is worth, and it is the only one that is a measurement
 * rather than a model: OpenStreetMap records what class a road is, and a
 * board on a trunk road is seen by a different order of traffic than one on
 * a secondary road. Google's traffic layer says how fast those roads are
 * moving right now; this says which roads they are.
 *
 * 10,169 ways, simplified from 162,443 nodes to 35,490 at a 25m tolerance —
 * indistinguishable at any zoom this map reaches, and 212 kB over the wire
 * instead of 13 MB.
 *
 * OpenStreetMap, ODbL, so the attribution the caller prints is a licence
 * term and not a courtesy.
 */

/** `[class, [lat, lng, lat, lng, …]]`, class indexing ROAD_CLASSES. */
export type Way = [number, number[]];

export const ROAD_CLASSES = ["motorway", "trunk", "primary", "secondary"] as const;

let cache: Promise<Way[]> | null = null;

export function loadRoads(): Promise<Way[]> {
  cache ??= fetch(assetUrl("data/roads-saurashtra.json"))
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { ways: Way[] }) => d.ways)
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}
