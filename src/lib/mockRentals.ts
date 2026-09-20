import { BOARDS } from "./mockBoards";
import { COMPANIES, SEASONALITY, type CompanyRecord } from "./companies";
import type { Board } from "./types";

/**
 * The permanent booking ledger — every rental that has ever run, not just the
 * one live on each board today. Without history you cannot answer "what months
 * do they book", "how many boards do they take at a time" or "is this client
 * growing", which is the entire point of the analytics page.
 *
 * Mirrors the real `rentals` table in supabase/01_build.sql, including the
 * snapshot columns: the board's attributes are frozen as they were at booking.
 */
export type RentalRecord = {
  id: string;
  boardId: string;
  boardCode: string;
  company: string;
  rate: number;              // per month
  startDate: string;
  endDate: string;
  months: number;
  contractValue: number;
  printedBy: "us" | "client";
  status: "active" | "completed";
  // frozen at booking
  city: string;
  area: string;
  sizeCategory: Board["sizeCategory"];
  lighting: Board["lighting"];
  askingRateAtBooking: number;
};

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Weighted pick, biased by how seasonal a category is in that month. */
function pickCompany(r: () => number, month: number): CompanyRecord {
  const weights = COMPANIES.map((c) => c.weight * (SEASONALITY[c.category][month] ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = r() * total;
  for (let i = 0; i < COMPANIES.length; i++) {
    t -= weights[i];
    if (t <= 0) return COMPANIES[i];
  }
  return COMPANIES[COMPANIES.length - 1];
}

const TODAY = new Date("2026-09-20");
const HISTORY_START = new Date("2023-10-01");

export function generateRentals(): RentalRecord[] {
  const r = rng(884411);
  const out: RentalRecord[] = [];
  let n = 0;

  for (const b of BOARDS) {
    // Walk forward from the start of history, filling the board's timeline
    // with back-to-back-ish bookings separated by vacancy gaps.
    const cursor = new Date(HISTORY_START);
    cursor.setDate(cursor.getDate() + Math.floor(r() * 120));

    while (cursor < TODAY) {
      const month = cursor.getMonth();
      const company = pickCompany(r, month);

      const months = ([1, 1, 2, 3, 3, 3, 6, 6, 12] as const)[Math.floor(r() * 9)];
      const start = new Date(cursor);
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      end.setDate(end.getDate() - 1);

      // don't fabricate bookings that run past today's live state
      if (start >= TODAY) break;

      const rate = Math.round((b.askingRate * (0.78 + r() * 0.24)) / 500) * 500;
      const isLive = end >= TODAY;

      n++;
      out.push({
        id: `r${n}`,
        boardId: b.id,
        boardCode: b.code,
        company: company.name,
        rate,
        startDate: iso(start),
        endDate: iso(end),
        months,
        contractValue: rate * months,
        printedBy: r() < 0.7 ? "us" : "client",
        status: isLive ? "active" : "completed",
        city: b.city,
        area: b.area,
        sizeCategory: b.sizeCategory,
        lighting: b.lighting,
        askingRateAtBooking: b.askingRate,
      });

      if (isLive) break;

      // vacancy gap before the next tenant
      cursor.setTime(end.getTime());
      cursor.setDate(cursor.getDate() + 1 + Math.floor(r() * 95));
    }
  }

  return out;
}

export const RENTALS = generateRentals();
