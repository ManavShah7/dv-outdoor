import { RENTALS, type RentalRecord } from "./mockRentals";
import { COMPANY_BY_NAME, type Category } from "./companies";
import type { Board } from "./types";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export { MONTH_NAMES };

export type Counted = { label: string; count: number };

export type CompanyProfile = {
  company: string;
  category: Category | null;

  // volume
  totalBookings: number;
  distinctBoards: number;
  currentBoards: number;
  peakConcurrentBoards: number;
  avgBoardsPerMonth: number;

  // money
  lifetimeValue: number;
  currentMonthlyValue: number;
  avgMonthlyRate: number;
  avgDiscountPct: number;

  // time
  firstBooking: string | null;
  lastBooking: string | null;
  avgDurationMonths: number;
  monthlyBookings: number[];   // 12 entries, Jan..Dec, all years combined
  byYear: { year: number; bookings: number; value: number }[];

  // place & spec preferences
  topCities: Counted[];
  topAreas: Counted[];
  sizeMix: Counted[];
  lightingMix: Counted[];
  printedByUs: number;
  printedByClient: number;
};

export type CategoryProfile = {
  category: Category;
  companies: number;
  totalBookings: number;
  lifetimeValue: number;
  currentBoards: number;
  avgMonthlyRate: number;
  monthlyBookings: number[];
  topCities: Counted[];
  topAreas: Counted[];
};

function tally(values: (string | null | undefined)[], top = 5): Counted[] {
  const m = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

/** Largest number of leases this client had running on the same day. */
function peakConcurrent(rentals: RentalRecord[]): number {
  const events: { t: number; d: number }[] = [];
  for (const r of rentals) {
    events.push({ t: new Date(r.startDate).getTime(), d: 1 });
    events.push({ t: new Date(r.endDate).getTime(), d: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.d - b.d);
  let cur = 0, peak = 0;
  for (const e of events) {
    cur += e.d;
    if (cur > peak) peak = cur;
  }
  return peak;
}

function monthSpan(rentals: RentalRecord[]): number {
  if (rentals.length === 0) return 1;
  const times = rentals.map((r) => new Date(r.startDate).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date();
  const months =
    (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()) + 1;
  return Math.max(1, months);
}

export function buildCompanyProfiles(rentals: RentalRecord[] = RENTALS): CompanyProfile[] {
  const byCompany = new Map<string, RentalRecord[]>();
  for (const r of rentals) {
    const list = byCompany.get(r.company) ?? [];
    list.push(r);
    byCompany.set(r.company, list);
  }

  const profiles: CompanyProfile[] = [];

  for (const [company, list] of byCompany) {
    const active = list.filter((r) => r.status === "active");
    const monthly = new Array(12).fill(0) as number[];
    const years = new Map<number, { bookings: number; value: number }>();
    let discountSum = 0, discountN = 0;

    for (const r of list) {
      const d = new Date(r.startDate);
      monthly[d.getMonth()] += 1;
      const y = d.getFullYear();
      const rec = years.get(y) ?? { bookings: 0, value: 0 };
      rec.bookings += 1;
      rec.value += r.contractValue;
      years.set(y, rec);
      if (r.askingRateAtBooking > 0) {
        discountSum += ((r.askingRateAtBooking - r.rate) / r.askingRateAtBooking) * 100;
        discountN += 1;
      }
    }

    const sorted = [...list].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const span = monthSpan(list);

    profiles.push({
      company,
      category: COMPANY_BY_NAME.get(company)?.category ?? null,

      totalBookings: list.length,
      distinctBoards: new Set(list.map((r) => r.boardId)).size,
      currentBoards: active.length,
      peakConcurrentBoards: peakConcurrent(list),
      avgBoardsPerMonth: Math.round((list.length / span) * 10) / 10,

      lifetimeValue: list.reduce((n, r) => n + r.contractValue, 0),
      currentMonthlyValue: active.reduce((n, r) => n + r.rate, 0),
      avgMonthlyRate: Math.round(list.reduce((n, r) => n + r.rate, 0) / list.length),
      avgDiscountPct: discountN ? Math.round((discountSum / discountN) * 10) / 10 : 0,

      firstBooking: sorted[0]?.startDate ?? null,
      lastBooking: sorted[sorted.length - 1]?.startDate ?? null,
      avgDurationMonths: Math.round((list.reduce((n, r) => n + r.months, 0) / list.length) * 10) / 10,
      monthlyBookings: monthly,
      byYear: [...years.entries()]
        .map(([year, v]) => ({ year, ...v }))
        .sort((a, b) => a.year - b.year),

      topCities: tally(list.map((r) => r.city)),
      topAreas: tally(list.map((r) => r.area)),
      sizeMix: tally(list.map((r) => r.sizeCategory as string)),
      lightingMix: tally(list.map((r) => r.lighting as string)),
      printedByUs: list.filter((r) => r.printedBy === "us").length,
      printedByClient: list.filter((r) => r.printedBy === "client").length,
    });
  }

  return profiles.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

export function buildCategoryProfiles(profiles: CompanyProfile[]): CategoryProfile[] {
  const byCat = new Map<Category, CompanyProfile[]>();
  for (const p of profiles) {
    if (!p.category) continue;
    const list = byCat.get(p.category) ?? [];
    list.push(p);
    byCat.set(p.category, list);
  }

  return [...byCat.entries()]
    .map(([category, list]) => {
      const monthly = new Array(12).fill(0) as number[];
      for (const p of list) p.monthlyBookings.forEach((n, i) => (monthly[i] += n));

      const cities = new Map<string, number>();
      const areas = new Map<string, number>();
      for (const p of list) {
        for (const c of p.topCities) cities.set(c.label, (cities.get(c.label) ?? 0) + c.count);
        for (const a of p.topAreas) areas.set(a.label, (areas.get(a.label) ?? 0) + a.count);
      }
      const top = (m: Map<string, number>) =>
        [...m.entries()].map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count).slice(0, 5);

      const bookings = list.reduce((n, p) => n + p.totalBookings, 0);

      return {
        category,
        companies: list.length,
        totalBookings: bookings,
        lifetimeValue: list.reduce((n, p) => n + p.lifetimeValue, 0),
        currentBoards: list.reduce((n, p) => n + p.currentBoards, 0),
        avgMonthlyRate: Math.round(
          list.reduce((n, p) => n + p.avgMonthlyRate * p.totalBookings, 0) / Math.max(1, bookings),
        ),
        monthlyBookings: monthly,
        topCities: top(cities),
        topAreas: top(areas),
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

export const COMPANY_PROFILES = buildCompanyProfiles();
export const CATEGORY_PROFILES = buildCategoryProfiles(COMPANY_PROFILES);

/** Portfolio-level rollup used by the header strip. */
export function portfolioTotals(boards: Board[]) {
  const active = RENTALS.filter((r) => r.status === "active");
  return {
    clients: COMPANY_PROFILES.length,
    categories: CATEGORY_PROFILES.length,
    totalBookings: RENTALS.length,
    lifetimeValue: RENTALS.reduce((n, r) => n + r.contractValue, 0),
    currentMonthly: active.reduce((n, r) => n + r.rate, 0),
    boards: boards.length,
  };
}
