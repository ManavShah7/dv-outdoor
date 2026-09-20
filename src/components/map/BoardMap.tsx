"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// `Map` is aliased: the component name would otherwise shadow the built-in Map.
import { APIProvider, Map as GoogleMap, useMap, Marker } from "@vis.gl/react-google-maps";
import type { Board } from "@/lib/types";
import { CITY_CENTRES } from "@/lib/mockBoards";

const SAURASHTRA = { lat: 21.98, lng: 70.55 };

/* A marker clusterer groups by pixel distance, which produces arbitrary blobs
   that straddle city lines. What the business actually wants zoomed out is
   "Junagadh 82" — a city aggregate. So: aggregates below the threshold,
   individual pins above it. Two mechanisms, one handoff. */
const CITY_ZOOM_MAX = 9.2;

const STATUS_COLOR: Record<Board["status"], string> = {
  available: "#30d158",
  booked: "#0a84ff",
  under_maintenance: "#ff9f0a",
  damaged: "#ff453a",
};

/* Order matters: the donut reads clockwise from the top, worst-news last, so a
   city with a damaged board always shows that slice in the same place. */
const STATUS_ORDER: Board["status"][] = ["available", "booked", "under_maintenance", "damaged"];

function svgUrl(svg: string) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/* ---------------------------------------------------------------- board pin
   A teardrop rather than a centred dot: the tip sits on the exact coordinate,
   so a pin points at its board instead of covering it — which matters when
   the whole promise of this product is that the location is pin-accurate.
   Size encodes the board's size category, the centre dot marks backlit. */
const PIN_SCALE: Record<NonNullable<Board["sizeCategory"]>, number> = {
  small: 0.82,
  medium: 1,
  large: 1.22,
};

function pinIcon(board: Board, selected: boolean) {
  const color = STATUS_COLOR[board.status];
  const k = (PIN_SCALE[board.sizeCategory ?? "medium"] ?? 1) * (selected ? 1.34 : 1);
  const w = Math.round(26 * k);
  const h = Math.round(34 * k);
  const pad = selected ? 16 : 6;
  const W = w + pad * 2;
  const H = h + pad * 2;

  const halo = selected
    ? `<circle cx="${W / 2}" cy="${pad + w / 2}" r="${w / 2 + 9}" fill="${color}" fill-opacity="0.22"/>`
    : "";

  // backlit boards carry a bright centre; frontlit and unlit stay hollow
  const core =
    board.lighting === "backlit"
      ? `<circle cx="${W / 2}" cy="${pad + w / 2}" r="${w * 0.17}" fill="#fff"/>`
      : `<circle cx="${W / 2}" cy="${pad + w / 2}" r="${w * 0.17}" fill="#fff" fill-opacity="0.34"/>`;

  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <ellipse cx="${W / 2}" cy="${pad + h - 1}" rx="${w * 0.2}" ry="${w * 0.07}" fill="#000" fill-opacity="0.22"/>
        ${halo}
        <g transform="translate(${pad} ${pad}) scale(${w / 24} ${h / 32})">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.373 18.627 0 12 0z"
                fill="${color}" stroke="#fff" stroke-width="${selected ? 3.2 : 2.4}" stroke-linejoin="round"
                vector-effect="non-scaling-stroke"/>
        </g>
        ${core}
      </svg>`,
    ),
    // anchor on the tip, not the centre
    anchor: new google.maps.Point(W / 2, pad + h),
    scaledSize: new google.maps.Size(W, H),
  };
}

/* -------------------------------------------------------------- city donut
   Zoomed out, a flat count tells you how many boards a city has but nothing
   about their state. A proportional ring answers "how much of Rajkot is
   actually earning?" without a click. */
function donutSegment(
  cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number,
) {
  const pt = (r: number, a: number) =>
    [cx + r * Math.sin(a), cy - r * Math.cos(a)].map((n) => n.toFixed(2));
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x1, y1] = pt(rOuter, a0);
  const [x2, y2] = pt(rOuter, a1);
  const [x3, y3] = pt(rInner, a1);
  const [x4, y4] = pt(rInner, a0);
  return `M${x1} ${y1}A${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}Z`;
}

function cityIcon(counts: Record<Board["status"], number>, total: number) {
  const d = total > 120 ? 74 : total > 60 ? 64 : total > 25 ? 56 : 48;
  const S = d + 12;
  const c = S / 2;
  const rOuter = d / 2;
  const rInner = d / 2 - Math.max(5, d * 0.115);

  let a = 0;
  const segs = STATUS_ORDER.map((st) => {
    const n = counts[st];
    if (!n) return "";
    const sweep = (n / total) * Math.PI * 2;
    // a single status filling the whole ring cannot be drawn as one arc
    const path =
      n === total
        ? `<circle cx="${c}" cy="${c}" r="${(rOuter + rInner) / 2}" fill="none" stroke="${STATUS_COLOR[st]}" stroke-width="${rOuter - rInner}"/>`
        : `<path d="${donutSegment(c, c, rOuter, rInner, a, a + sweep)}" fill="${STATUS_COLOR[st]}"/>`;
    a += sweep;
    return path;
  }).join("");

  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
        <circle cx="${c}" cy="${c}" r="${rOuter + 4}" fill="#0b0e10" fill-opacity="0.18"/>
        <circle cx="${c}" cy="${c}" r="${rInner + 0.5}" fill="#12161a" fill-opacity="0.94"/>
        ${segs}
        <circle cx="${c}" cy="${c}" r="${rOuter}" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="1"/>
      </svg>`,
    ),
    anchor: new google.maps.Point(c, c),
    scaledSize: new google.maps.Size(S, S),
  };
}

function Layers({
  boards,
  selectedId,
  onSelect,
  insetLeft,
}: {
  boards: Board[];
  selectedId?: string;
  onSelect: (b: Board) => void;
  insetLeft: number;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(8.4);
  const fitted = useRef(false);

  useEffect(() => {
    if (!map) return;
    const l = map.addListener("zoom_changed", () => setZoom(map.getZoom() ?? 8.4));
    return () => l.remove();
  }, [map]);

  // Frame the real inventory once, rather than hard-coding a centre that
  // wastes half the canvas on the Arabian Sea.
  useEffect(() => {
    if (!map || fitted.current || boards.length === 0) return;
    fitted.current = true;
    const b = new google.maps.LatLngBounds();
    for (const board of boards) b.extend({ lat: board.lat, lng: board.lng });
    map.fitBounds(b, { top: 72, right: 72, bottom: 96, left: insetLeft });
  }, [map, boards, insetLeft]);

  // Selecting a board should take you there — otherwise the inspector and the
  // map are describing two different places.
  useEffect(() => {
    if (!map || !selectedId) return;
    const b = boards.find((x) => x.id === selectedId);
    if (!b) return;
    if ((map.getZoom() ?? 0) < 13) map.setZoom(15);
    map.panTo({ lat: b.lat, lng: b.lng });
    // shift the target right of the floating chrome so it lands in open canvas
    map.panBy(-insetLeft / 2, 0);
  }, [map, selectedId, boards, insetLeft]);

  const cityCounts = useMemo(() => {
    const byCity = new Map<string, Record<Board["status"], number>>();
    for (const b of boards) {
      let rec = byCity.get(b.city);
      if (!rec) {
        rec = { available: 0, booked: 0, under_maintenance: 0, damaged: 0 };
        byCity.set(b.city, rec);
      }
      rec[b.status] += 1;
    }
    return CITY_CENTRES.map((c) => {
      const rec = byCity.get(c.city);
      const total = rec ? Object.values(rec).reduce((a, n) => a + n, 0) : 0;
      return { ...c, counts: rec, total };
    }).filter((c) => c.total > 0 && c.counts);
  }, [boards]);

  if (!map) return null;

  if (zoom <= CITY_ZOOM_MAX) {
    return (
      <>
        {cityCounts.map((c) => (
          <Marker
            key={c.city}
            position={{ lat: c.lat, lng: c.lng }}
            icon={cityIcon(c.counts!, c.total)}
            label={{
              text: String(c.total),
              color: "#ffffff",
              fontSize: c.total > 99 ? "15px" : "16px",
              fontWeight: "650",
              className: "dv-city-label",
            }}
            title={`${c.city} — ${c.total} boards · ${c.counts!.available} available, ${c.counts!.booked} booked, ${c.counts!.damaged + c.counts!.under_maintenance} needing work`}
            onClick={() => map?.panTo({ lat: c.lat, lng: c.lng })}
            zIndex={10}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {boards.map((b) => (
        <Marker
          key={b.id}
          position={{ lat: b.lat, lng: b.lng }}
          icon={pinIcon(b, b.id === selectedId)}
          onClick={() => onSelect(b)}
          zIndex={b.id === selectedId ? 999 : 1}
        />
      ))}
    </>
  );
}

export function BoardMap({
  boards,
  selectedId,
  onSelect,
  insetLeft = 0,
}: {
  boards: Board[];
  selectedId?: string;
  onSelect: (b: Board) => void;
  /** width of the floating chrome covering the left of the canvas */
  insetLeft?: number;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return (
      <div className="grid size-full place-items-center bg-ink-100 text-ink-600">
        <p className="text-subhead">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.</p>
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <APIProvider apiKey={key}>
        <GoogleMap
          defaultCenter={SAURASHTRA}
          defaultZoom={8}
          minZoom={6}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          styles={[
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          ]}
          style={{ width: "100%", height: "100%" }}
        >
          <Layers boards={boards} selectedId={selectedId} onSelect={onSelect} insetLeft={insetLeft} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
