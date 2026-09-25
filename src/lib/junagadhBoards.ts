import { assetUrl } from "./assets";

/** A board imported from the real availability deck. */
export type DeckBoard = {
  code: string;
  city: string | null;
  location: string | null;
  widthFt: number;
  heightFt: number;
  sqft: number;
  lighting: "backlit" | "frontlit" | null;
  askingRate: number | null;
  status: string;
  photo: string | null;
  /** the deck carries no coordinates; these arrive separately */
  lat: number | null;
  lng: number | null;
  positionVerified: boolean;
};

/**
 * The imported deck, read from Supabase Storage rather than bundled.
 *
 * It used to be a static import of `private/deck/parsed.json`, which is
 * gitignored — that built locally and failed on any clean checkout. See
 * ./assets.ts for why the data lives outside the repo.
 *
 * Cached for the lifetime of the server process; the deck changes when a new
 * city is imported, which means a redeploy anyway.
 */
let cached: Promise<DeckBoard[]> | null = null;

export function getDeckBoards(): Promise<DeckBoard[]> {
  cached ??= fetch(assetUrl("deck/parsed.json"), { next: { revalidate: 3600 } })
    .then((r) => {
      if (!r.ok) throw new Error(`deck fetch failed: ${r.status}`);
      return r.json();
    })
    .then((deck: { boards: DeckBoard[] }) =>
      deck.boards
        .filter((b) => b.photo)
        .map((b) => ({ ...b, photo: assetUrl(b.photo!) })),
    )
    .catch((e) => {
      // A landing page with no photos beats a 500. The tiles fall back.
      console.error(e);
      cached = null;
      return [];
    });
  return cached;
}

export function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bNr\.\s*/gi, "Nr. ")
    .replace(/\bOpp\.\s*/gi, "Opp. ")
    .replace(/\bS\.t\./gi, "S.T.");
}
