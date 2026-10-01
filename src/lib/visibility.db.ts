import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/visibility";

/**
 * What we can evidence about a board, as opposed to what we can claim.
 *
 * Every number here is computed by `scripts/board-visibility.mjs` from open
 * data with a licence attached, and none of it is a guess:
 *
 *   road        OpenStreetMap (ODbL) — the nearest motorway/trunk/primary/
 *               secondary way and how far off it the board sits. The single
 *               most relevant fact about a hoarding, and a measurement.
 *   people1km   Kontur (CC BY) — 400m population cells summed inside 1 km.
 *   landmarks   OpenStreetMap (ODbL) — the junctions, stations and markets
 *               already in `hotspots`, counted only where the board falls
 *               inside the landmark's own reach.
 *   night       NASA VIIRS Black Marble — ranked against the rest of the
 *               inventory rather than given as a raw radiance, because
 *               "brighter than 9 in 10 of our sites" is the useful form.
 *
 * Read with `getVisibility()`, keyed by board code, which degrades to an
 * empty map rather than failing the page: this table is populated by a script that runs on demand,
 * and a public map must not 500 because nobody has run it yet.
 */

type Row = {
  board_id: string;
  /** embedded through the foreign key, so one query answers both */
  boards: { code: string } | null;
  score: number;
  road_name: string | null;
  road_class: Visibility["roadClass"];
  road_distance_m: number | null;
  road_lanes: number | null;
  people_1km: number;
  landmark_count: number;
  landmark_top: Visibility["landmarkTop"] | null;
  night_percentile: number;
};

export async function getVisibility(): Promise<Map<string, Visibility>> {
  const out = new Map<string, Visibility>();
  try {
    const db = createAdminClient();
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from("board_visibility")
        .select("board_id,score,road_name,road_class,road_distance_m,road_lanes,people_1km,landmark_count,landmark_top,night_percentile,boards(code)")
        .range(from, from + PAGE - 1)
        .returns<Row[]>();
      if (error) throw error;
      for (const r of data ?? []) {
        // Keyed by code, not by id. Board ids are database UUIDs and the
        // portals pass codes around; joining on the id is exactly what
        // silently emptied the maintenance queue once already.
        const code = r.boards?.code;
        if (!code) continue;
        out.set(code, {
          score: r.score,
          roadName: r.road_name,
          roadClass: r.road_class,
          roadDistanceM: r.road_distance_m,
          roadLanes: r.road_lanes,
          people1km: r.people_1km,
          landmarkCount: r.landmark_count,
          landmarkTop: r.landmark_top ?? [],
          nightPercentile: r.night_percentile,
        });
      }
      if (!data || data.length < PAGE) break;
    }
  } catch {
    // The table may not exist yet, or the script may never have been run.
    // Either way the map simply shows no evidence rather than no map.
    return out;
  }
  return out;
}
