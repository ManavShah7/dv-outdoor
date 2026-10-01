/**
 * The shape of a board's evidence, and the floor it has to clear before a
 * client is shown any of it.
 *
 * Deliberately free of server imports. The read path lives in
 * `visibility.db.ts`, which is `server-only`; this file is the half that the
 * browser is allowed to have, because the panel that renders the block runs
 * there and `isEvidenced` is a value rather than a type.
 */

export type Visibility = {
  /** 0-100, weighted across the four sources, ranked within our inventory */
  score: number;
  roadName: string | null;
  roadClass: "motorway" | "trunk" | "primary" | "secondary" | null;
  roadDistanceM: number | null;
  roadLanes: number | null;
  people1km: number;
  landmarkCount: number;
  landmarkTop: { name: string; kind: string; m: number }[];
  nightPercentile: number;
};

/**
 * A board is only worth showing numbers for when the numbers mean something.
 *
 * On generated coordinates two thirds of this inventory sits in open ground —
 * kilometres from any classified road, with nobody inside a kilometre. A
 * "visibility 0" badge on a public site is worse than no badge, so a row has
 * to clear a floor before a client ever sees it: on or beside a real road,
 * with real people around it. The day the real survey coordinates land, most
 * of the inventory clears this on its own.
 */
export function isEvidenced(v: Visibility): boolean {
  return v.roadDistanceM !== null && v.roadDistanceM <= 150 && v.people1km >= 500;
}
