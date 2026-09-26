import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * The hotspot layer: the places a hoarding cares about.
 *
 * Not inventory — context. A board is worth what passes it, and what passes
 * it is decided by the junction it sits on and the market down the road.
 */

export type HotspotKind =
  | "junction" | "station" | "market" | "mall" | "college" | "hospital"
  | "temple" | "landmark" | "beach" | "stadium" | "cinema" | "high_street" | "other";

export type Hotspot = {
  id: string;
  name: string;
  kind: HotspotKind;
  city: string;
  lat: number;
  lng: number;
  /** 1 minor … 5 the busiest thing in the city */
  weight: number;
  /** how far it still pulls people, metres */
  radiusM: number;
  source: string;
  notes: string | null;
};

type Row = {
  id: string; name: string; kind: HotspotKind; city: string;
  lat: number; lng: number; weight: number; radius_m: number;
  source: string; notes: string | null;
};

export async function getHotspots(): Promise<Hotspot[]> {
  const db = createAdminClient();
  const out: Hotspot[] = [];
  const PAGE = 1000;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("hotspots")
      .select("id,name,kind,city,lat,lng,weight,radius_m,source,notes")
      .eq("is_active", true)
      .order("weight", { ascending: false })
      .range(from, from + PAGE - 1);
    // The table may not exist yet on a database that has not run the
    // migration. An empty layer is a fine degradation; a 500 on the public
    // map is not.
    if (error) {
      console.error("getHotspots:", error.message);
      return out;
    }
    out.push(
      ...(data as Row[]).map((r) => ({
        id: r.id, name: r.name, kind: r.kind, city: r.city,
        lat: r.lat, lng: r.lng, weight: r.weight, radiusM: r.radius_m,
        source: r.source, notes: r.notes,
      })),
    );
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/** Metres between two points. Good enough at city scale. */
export function metres(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6_371_000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la = (aLat * Math.PI) / 180;
  const lb = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Which hotspots reach a given point, nearest first.
 *
 * "Reach" is the hotspot's own radius, not a fixed number — a railway station
 * pulls people from further than a corner temple, and pretending otherwise
 * would rank every board next to a temple as highly as one outside the
 * station.
 */
export function hotspotsNear(lat: number, lng: number, all: Hotspot[]) {
  return all
    .map((h) => ({ ...h, distanceM: Math.round(metres(lat, lng, h.lat, h.lng)) }))
    .filter((h) => h.distanceM <= h.radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);
}
