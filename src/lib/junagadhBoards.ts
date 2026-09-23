import parsed from "../../private/deck/parsed.json";

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

export const DECK_BOARDS = (parsed.boards as DeckBoard[]).filter((b) => b.photo);

export function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bNr\.\s*/gi, "Nr. ")
    .replace(/\bOpp\.\s*/gi, "Opp. ")
    .replace(/\bS\.t\./gi, "S.T.");
}
