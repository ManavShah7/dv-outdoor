import type Anthropic from "@anthropic-ai/sdk";
import { BOARDS } from "./mockBoards";
import { MAINTENANCE } from "./mockMaintenance";
import { COMPANY_PROFILES, CATEGORY_PROFILES, MONTH_NAMES } from "./analytics";
import { CATEGORIES } from "./companies";
import type { Board } from "./types";

/**
 * Tools the assistant can call. Reads run here against the dataset; writes do
 * NOT mutate anything server-side — they return a structured `action` that the
 * client applies to its own state. That keeps a model-initiated change
 * reviewable and reversible, and maps cleanly onto the real thing later: once
 * Supabase is wired these become audited RPC calls and the action becomes the
 * row that gets written.
 */
export type AgentAction =
  | { kind: "book_board"; code: string; company: string; rate: number; startDate: string; endDate: string; printedBy: "us" | "client" }
  | { kind: "set_status"; code: string; status: Board["status"] }
  | { kind: "focus_board"; code: string };

function compact(b: Board) {
  return {
    code: b.code,
    name: b.name,
    city: b.city,
    area: b.area,
    status: b.status,
    size: b.sizeCategory,
    dimensions: `${b.widthFt}x${b.heightFt}`,
    lighting: b.lighting,
    askingRate: b.askingRate,
    client: b.rental?.company ?? null,
    rate: b.rental?.rate ?? null,
    leaseEnds: b.rental?.endDate ?? null,
  };
}

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_boards",
    description:
      "Search the board inventory. Combine any filters. Returns up to `limit` compact board records. Use this for questions like 'available backlit boards in Rajkot under 50000' or 'which boards are damaged'.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free text matched against name, area, city, address, code and client name" },
        city: { type: "string" },
        status: { type: "string", enum: ["available", "booked", "under_maintenance", "damaged"] },
        lighting: { type: "string", enum: ["backlit", "frontlit", "none"] },
        size: { type: "string", enum: ["small", "medium", "large"] },
        maxRate: { type: "number", description: "Maximum asking rate per month in rupees" },
        minRate: { type: "number" },
        limit: { type: "number", description: "Default 20, max 60" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_board",
    description: "Full detail for one board by its code, e.g. RAJ-014.",
    input_schema: {
      type: "object",
      properties: { code: { type: "string" } },
      required: ["code"],
      additionalProperties: false,
    },
  },
  {
    name: "get_stats",
    description:
      "Portfolio totals: board counts by status, monthly revenue from active rentals, occupancy rate, and per-city breakdown.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "get_company_analytics",
    description:
      "Per-client ledger. Omit `company` for every client ranked by revenue. Answers 'how much has Audi spent', 'who are our biggest clients', 'which months does Croma book'.",
    input_schema: {
      type: "object",
      properties: { company: { type: "string" } },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "list_maintenance",
    description: "Open maintenance requests with AI severity, urgency score and daily revenue at risk.",
    input_schema: {
      type: "object",
      properties: {
        severity: { type: "string", enum: ["red", "orange", "yellow"] },
        limit: { type: "number" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_client_profile",
    description:
      "Everything known about one client: total bookings, boards held now and at peak, lifetime value, average rate and discount, average lease length, which calendar months they book in, year-on-year totals, favourite cities and areas, and their size/lighting preferences. Use the client's name, partial is fine.",
    input_schema: {
      type: "object",
      properties: { company: { type: "string" } },
      required: ["company"],
      additionalProperties: false,
    },
  },
  {
    name: "list_clients",
    description:
      "All clients ranked by lifetime value, optionally filtered to one category. Use for 'who are our biggest clients', 'which jewellery brands book with us'.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: CATEGORIES },
        limit: { type: "number" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_category_profile",
    description:
      "Rollup for an industry category: number of clients, bookings, lifetime value, boards held now, average rate, monthly seasonality and favourite areas. Omit `category` to get every category ranked by value.",
    input_schema: {
      type: "object",
      properties: { category: { type: "string", enum: CATEGORIES } },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "book_board",
    description:
      "Mark a board as booked. Requires every commercial term. Confirm the company, rate and dates with the user before calling this — it changes inventory.",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string" },
        company: { type: "string" },
        rate: { type: "number", description: "Monthly rate in rupees" },
        startDate: { type: "string", description: "YYYY-MM-DD" },
        endDate: { type: "string", description: "YYYY-MM-DD" },
        printedBy: { type: "string", enum: ["us", "client"] },
      },
      required: ["code", "company", "rate", "startDate", "endDate"],
      additionalProperties: false,
    },
  },
  {
    name: "set_board_status",
    description: "Change a board's status, e.g. flag it damaged or put it under maintenance.",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string" },
        status: { type: "string", enum: ["available", "booked", "under_maintenance", "damaged"] },
      },
      required: ["code", "status"],
      additionalProperties: false,
    },
  },
  {
    name: "show_on_map",
    description: "Open a board on the map for the user. Use when they ask to see or find a specific board.",
    input_schema: {
      type: "object",
      properties: { code: { type: "string" } },
      required: ["code"],
      additionalProperties: false,
    },
  },
];

type Json = Record<string, unknown>;

export function runTool(
  name: string,
  input: Json,
  boards: Board[] = BOARDS,
): { result: unknown; action?: AgentAction } {
  const byCode = (c: string) =>
    boards.find((b) => b.code.toLowerCase() === String(c).toLowerCase());

  switch (name) {
    case "search_boards": {
      const q = String(input.query ?? "").trim().toLowerCase();
      const limit = Math.min(Number(input.limit ?? 20) || 20, 60);
      const hits = boards.filter((b) => {
        if (input.city && b.city.toLowerCase() !== String(input.city).toLowerCase()) return false;
        if (input.status && b.status !== input.status) return false;
        if (input.lighting && b.lighting !== input.lighting) return false;
        if (input.size && b.sizeCategory !== input.size) return false;
        if (input.maxRate != null && b.askingRate > Number(input.maxRate)) return false;
        if (input.minRate != null && b.askingRate < Number(input.minRate)) return false;
        if (!q) return true;
        return (
          b.name.toLowerCase().includes(q) ||
          b.area.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.rental?.company.toLowerCase().includes(q) ?? false)
        );
      });
      return {
        result: { matched: hits.length, showing: Math.min(hits.length, limit), boards: hits.slice(0, limit).map(compact) },
      };
    }

    case "get_board": {
      const b = byCode(String(input.code));
      if (!b) return { result: { error: `No board with code ${input.code}` } };
      return { result: { ...compact(b), address: b.address, lat: b.lat, lng: b.lng, rental: b.rental ?? null } };
    }

    case "get_stats": {
      const by = (s: Board["status"]) => boards.filter((b) => b.status === s).length;
      const monthly = boards.reduce((n, b) => n + (b.rental?.rate ?? 0), 0);
      const cities = new Map<string, { total: number; available: number }>();
      for (const b of boards) {
        const c = cities.get(b.city) ?? { total: 0, available: 0 };
        c.total += 1;
        if (b.status === "available") c.available += 1;
        cities.set(b.city, c);
      }
      return {
        result: {
          total: boards.length,
          available: by("available"),
          booked: by("booked"),
          underMaintenance: by("under_maintenance"),
          damaged: by("damaged"),
          monthlyRevenueInr: monthly,
          occupancyPct: Math.round((by("booked") / boards.length) * 1000) / 10,
          byCity: Object.fromEntries(cities),
        },
      };
    }

    case "get_company_analytics": {
      const agg = new Map<string, { bookings: number; monthlyInr: number; cities: Map<string, number>; months: Map<number, number> }>();
      for (const b of boards) {
        if (!b.rental) continue;
        const k = b.rental.company;
        const rec = agg.get(k) ?? { bookings: 0, monthlyInr: 0, cities: new Map(), months: new Map() };
        rec.bookings += 1;
        rec.monthlyInr += b.rental.rate;
        rec.cities.set(b.city, (rec.cities.get(b.city) ?? 0) + 1);
        const m = new Date(b.rental.startDate).getMonth() + 1;
        rec.months.set(m, (rec.months.get(m) ?? 0) + 1);
        agg.set(k, rec);
      }
      const top = (m: Map<string | number, number>) =>
        [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const rows = [...agg.entries()]
        .map(([company, r]) => ({
          company,
          boardsHeld: r.bookings,
          monthlyInr: r.monthlyInr,
          favouriteCity: top(r.cities as Map<string | number, number>),
          favouriteMonth: top(r.months as Map<string | number, number>),
        }))
        .sort((a, b) => b.monthlyInr - a.monthlyInr);
      const wanted = input.company
        ? rows.filter((r) => r.company.toLowerCase().includes(String(input.company).toLowerCase()))
        : rows;
      return { result: { companies: wanted } };
    }

    case "list_maintenance": {
      const limit = Math.min(Number(input.limit ?? 15) || 15, 40);
      const rows = MAINTENANCE.filter((r) => r.status !== "resolved")
        .filter((r) => !input.severity || r.aiSeverity === input.severity)
        .sort((a, b) => b.aiUrgencyScore - a.aiUrgencyScore)
        .slice(0, limit)
        .map((r) => {
          const b = boards.find((x) => x.id === r.boardId);
          return {
            board: b?.code ?? "?",
            boardName: b?.name ?? "?",
            city: b?.city,
            severity: r.aiSeverity,
            urgency: r.aiUrgencyScore,
            fault: r.description,
            reportedBy: r.reportedByName,
            revenueAtRiskPerDay: r.revenueAtRisk,
            reasoning: r.aiReasoning,
          };
        });
      return { result: { open: rows.length, requests: rows } };
    }

    case "get_client_profile": {
      const q = String(input.company ?? "").toLowerCase();
      const p = COMPANY_PROFILES.find((x) => x.company.toLowerCase().includes(q));
      if (!p) return { result: { error: `No client matching "${input.company}".` } };
      return {
        result: {
          ...p,
          monthlyBookings: Object.fromEntries(p.monthlyBookings.map((n, i) => [MONTH_NAMES[i], n])),
        },
      };
    }

    case "list_clients": {
      const limit = Math.min(Number(input.limit ?? 15) || 15, 40);
      const rows = COMPANY_PROFILES.filter((p) => !input.category || p.category === input.category)
        .slice(0, limit)
        .map((p) => ({
          company: p.company,
          category: p.category,
          currentBoards: p.currentBoards,
          totalBookings: p.totalBookings,
          lifetimeValue: p.lifetimeValue,
          currentMonthlyValue: p.currentMonthlyValue,
          avgMonthlyRate: p.avgMonthlyRate,
          topCity: p.topCities[0]?.label ?? null,
        }));
      return { result: { clients: rows, totalClients: COMPANY_PROFILES.length } };
    }

    case "get_category_profile": {
      const wanted = input.category
        ? CATEGORY_PROFILES.filter((c) => c.category === input.category)
        : CATEGORY_PROFILES;
      return {
        result: {
          categories: wanted.map((c) => ({
            ...c,
            monthlyBookings: Object.fromEntries(c.monthlyBookings.map((n, i) => [MONTH_NAMES[i], n])),
          })),
        },
      };
    }

    case "book_board": {
      const b = byCode(String(input.code));
      if (!b) return { result: { error: `No board with code ${input.code}` } };
      if (b.status === "booked")
        return { result: { error: `${b.code} is already booked to ${b.rental?.company}. End that lease first.` } };
      const action: AgentAction = {
        kind: "book_board",
        code: b.code,
        company: String(input.company),
        rate: Number(input.rate),
        startDate: String(input.startDate),
        endDate: String(input.endDate),
        printedBy: input.printedBy === "client" ? "client" : "us",
      };
      const discount = b.askingRate
        ? Math.round(((b.askingRate - Number(input.rate)) / b.askingRate) * 1000) / 10
        : null;
      return {
        result: { ok: true, booked: b.code, askingRate: b.askingRate, agreedRate: Number(input.rate), discountPct: discount },
        action,
      };
    }

    case "set_board_status": {
      const b = byCode(String(input.code));
      if (!b) return { result: { error: `No board with code ${input.code}` } };
      return {
        result: { ok: true, code: b.code, from: b.status, to: input.status },
        action: { kind: "set_status", code: b.code, status: input.status as Board["status"] },
      };
    }

    case "show_on_map": {
      const b = byCode(String(input.code));
      if (!b) return { result: { error: `No board with code ${input.code}` } };
      return { result: { ok: true, code: b.code, name: b.name }, action: { kind: "focus_board", code: b.code } };
    }

    default:
      return { result: { error: `Unknown tool ${name}` } };
  }
}
