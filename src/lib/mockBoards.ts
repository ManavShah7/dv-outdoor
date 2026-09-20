import type { Board, BoardStatus, Lighting, SizeCategory } from "./types";

/**
 * 650 boards across Saurashtra at realistic density. The previous build was
 * designed against a handful of seed rows, and thin content is a large part of
 * why the layout never felt right — real density changes every spacing call.
 */
const CITIES = [
  { city: "Rajkot",     lat: 22.3039, lng: 70.8022, weight: 175, pin: "360001",
    areas: ["Kalawad Road", "University Road", "Yagnik Road", "Gondal Road", "Raiya Road", "150 Ft Ring Road"] },
  { city: "Jamnagar",   lat: 22.4707, lng: 70.0577, weight: 88,  pin: "361001",
    areas: ["Indira Marg", "Summair Club Road", "Pandit Nehru Marg", "Bedi Bandar Road"] },
  { city: "Bhavnagar",  lat: 21.7645, lng: 72.1519, weight: 82,  pin: "364001",
    areas: ["Waghawadi Road", "Kalanala", "Ghogha Circle", "Chitra"] },
  { city: "Junagadh",   lat: 21.5222, lng: 70.4579, weight: 77,  pin: "362001",
    areas: ["Motibaug Road", "Kalwa Chowk", "Joshipura", "Zanzarda Road"] },
  { city: "Porbandar",  lat: 21.6417, lng: 69.6293, weight: 44,  pin: "360575",
    areas: ["MG Road", "Chowpatty Road", "Kuchhadi Road"] },
  { city: "Gondal",     lat: 21.9610, lng: 70.8022, weight: 38,  pin: "360311",
    areas: ["Station Road", "Kolki Road", "Dhoraji Road"] },
  { city: "Jetpur",     lat: 21.7548, lng: 70.6237, weight: 32,  pin: "360370",
    areas: ["NH-27 Bypass", "Kagvad Road", "Navagadh"] },
  { city: "Morbi",      lat: 22.8173, lng: 70.8370, weight: 34,  pin: "363641",
    areas: ["Sanala Road", "Ravapar Road", "Nazarbaug"] },
  { city: "Surendranagar", lat: 22.7469, lng: 71.6479, weight: 26, pin: "363001",
    areas: ["Wadhwan Road", "Station Road"] },
  { city: "Veraval",    lat: 20.9159, lng: 70.3629, weight: 20, pin: "362265",
    areas: ["Somnath Road", "Bhidiya Plot"] },
  { city: "Dwarka",     lat: 22.2394, lng: 68.9678, weight: 18, pin: "361335",
    areas: ["Temple Road", "Okha Highway"] },
  { city: "Amreli",     lat: 21.6032, lng: 71.2115, weight: 16, pin: "365601",
    areas: ["Station Road", "Lathi Road"] },
];

const COMPANIES = [
  "Audi Junagadh", "Reliance Trends", "Tanishq", "Malabar Gold", "Croma",
  "Kalyan Jewellers", "Bajaj Finserv", "HDFC Bank", "Asian Paints", "Amul",
  "Jio Fiber", "Havells", "Royal Enfield", "Lodha Developers", "Patanjali",
];

const SIZES: { c: SizeCategory; w: number; h: number; mult: number }[] = [
  { c: "small",  w: 12, h: 8,  mult: 0.55 },
  { c: "medium", w: 20, h: 12, mult: 1 },
  { c: "medium", w: 24, h: 12, mult: 1.2 },
  { c: "large",  w: 40, h: 20, mult: 2.4 },
  { c: "large",  w: 60, h: 20, mult: 3.4 },
];

/** Deterministic PRNG so the layout is identical on server and client. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function generateBoards(): Board[] {
  const r = rng(20260919);
  const boards: Board[] = [];
  let n = 0;

  for (const c of CITIES) {
    for (let i = 0; i < c.weight; i++) {
      n++;
      // scatter within ~6km, denser toward the centre
      const spread = Math.pow(r(), 1.7) * 0.055;
      const angle = r() * Math.PI * 2;
      const lat = c.lat + Math.cos(angle) * spread;
      const lng = c.lng + Math.sin(angle) * spread * 1.08;

      const size = pick(r, SIZES);
      const lighting: Lighting = r() < 0.52 ? "frontlit" : r() < 0.88 ? "backlit" : "none";
      const askingRate = Math.round((28000 * size.mult * (lighting === "backlit" ? 1.25 : 1)) / 500) * 500;

      // realistic mix: mostly booked, a thin slice available, a few in trouble
      const roll = r();
      let status: BoardStatus = "booked";
      if (roll > 0.955) status = "damaged";
      else if (roll > 0.925) status = "under_maintenance";
      else if (roll > 0.80) status = "available";

      const area = pick(r, c.areas);
      const board: Board = {
        id: `b${n}`,
        code: `${c.city.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        name: `${area} ${size.c === "large" ? "Unipole" : "Hoarding"}`,
        lat, lng,
        address: `${Math.floor(r() * 90) + 1} ${area}, ${c.city} ${c.pin}`,
        area,
        city: c.city,
        pincode: c.pin,
        status,
        lighting,
        sizeCategory: size.c,
        widthFt: size.w,
        heightFt: size.h,
        askingRate,
      };

      const carriesRental =
        status === "booked" ||
        ((status === "damaged" || status === "under_maintenance") && r() < 0.62);

      if (carriesRental) {
        const start = new Date(2026, Math.floor(r() * 9), Math.floor(r() * 27) + 1);
        const months = pick(r, [1, 1, 2, 3, 3, 6, 12]);
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        board.rental = {
          company: pick(r, COMPANIES),
          rate: Math.round((askingRate * (0.8 + r() * 0.2)) / 500) * 500,
          startDate: isoDate(start),
          endDate: isoDate(end),
          printedBy: r() < 0.7 ? "us" : "client",
          contactPerson: pick(r, ["Manav Shah", "Rakesh Patel", "Nilesh Joshi", "Priya Mehta", "Asif Qureshi"]),
          phone: `+91 ${pick(r, [6, 7, 8, 9])}${String(Math.floor(r() * 1e9)).padStart(9, "0")}`,
        };
      }

      if (status === "available") {
        const since = new Date(2026, Math.floor(r() * 9), Math.floor(r() * 27) + 1);
        board.availableSince = isoDate(since);
      }

      boards.push(board);
    }
  }
  return boards;
}

export const BOARDS = generateBoards();

export const CITY_CENTRES = CITIES.map((c) => ({ city: c.city, lat: c.lat, lng: c.lng }));
