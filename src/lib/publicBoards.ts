import { BOARDS } from "./mockBoards";
import { COMPANY_PROFILES } from "./analytics";
import type { Board } from "./types";

/**
 * What a member of the public is allowed to see about a board.
 *
 * Deliberately omits the client name and the agreed rent on booked boards.
 * A prospect needs to know *when* a site frees up, not what the last
 * advertiser paid for it — publishing that hands competitors DV's rate card
 * and hands every future client the floor of the negotiation. The asking rate
 * is shown because that is the number DV is quoting anyway.
 */
export type PublicBoard = {
  code: string;
  name: string;
  city: string;
  area: string;
  pincode: string;
  address: string;
  lat: number;
  lng: number;
  widthFt: number;
  heightFt: number;
  sizeCategory: Board["sizeCategory"];
  lighting: Board["lighting"];
  askingRate: number;
  /** "available" | "booked" — maintenance states are not the public's business */
  availability: "available" | "booked";
  /** only when booked: the date it frees up */
  freeFrom: string | null;
};

export function toPublic(b: Board): PublicBoard {
  const booked = b.status === "booked" && !!b.rental;
  return {
    code: b.code,
    name: b.name,
    city: b.city,
    area: b.area,
    pincode: b.pincode,
    address: b.address,
    lat: b.lat,
    lng: b.lng,
    widthFt: b.widthFt,
    heightFt: b.heightFt,
    sizeCategory: b.sizeCategory,
    lighting: b.lighting,
    askingRate: b.askingRate,
    // A board under maintenance is still sellable for a future date, so it
    // reads as available rather than advertising DV's internal problems.
    availability: booked ? "booked" : "available",
    freeFrom: booked ? b.rental!.endDate : null,
  };
}

/**
 * The generated array, kept only for the places that have not moved to the
 * database yet (the field pages and the agent tools). Anything a client sees
 * comes from getPublicBoards() so that an edit in the office shows up.
 */
export const PUBLIC_BOARDS: PublicBoard[] = BOARDS.map(toPublic);

export const PUBLIC_CITIES = [...new Set(PUBLIC_BOARDS.map((b) => b.city))].sort();

/** Headline numbers for the landing page. All derived, none invented. */
export function publicStats() {
  const available = PUBLIC_BOARDS.filter((b) => b.availability === "available").length;
  return {
    boards: PUBLIC_BOARDS.length,
    cities: PUBLIC_CITIES.length,
    available,
    // clients with a live booking right now
    liveBrands: COMPANY_PROFILES.filter((p) => p.currentBoards > 0).length,
  };
}

/** Brands currently running with DV — used for the credibility strip. */
export function liveBrandNames(limit = 12): string[] {
  return COMPANY_PROFILES.filter((p) => p.currentBoards > 0)
    .sort((a, b) => b.currentBoards - a.currentBoards)
    .slice(0, limit)
    .map((p) => p.company);
}
