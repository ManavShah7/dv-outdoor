"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// `Map` is aliased: the component name would otherwise shadow the built-in Map.
import { Map as GoogleMap, useMap, Marker } from "@vis.gl/react-google-maps";
import type { PublicBoard } from "@/lib/publicBoards";

const CITY_ZOOM_MAX = 9.2;

/**
 * The public map speaks the brand's language: black, white, hairlines.
 *
 * Availability is carried by fill rather than hue — a free board is solid
 * black and a booked one is hollow — so the thing a client is looking for is
 * the loud one, and the map still reads for anyone who cannot separate green
 * from blue. The admin map keeps its colours; that is a working tool for two
 * people, not the shopfront.
 */
const INK = "#000000";
const PAPER = "#ffffff";

function svgUrl(svg: string) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

const PIN_SCALE: Record<string, number> = { small: 0.82, medium: 1, large: 1.22 };

function pinIcon(b: PublicBoard, selected: boolean) {
  const free = b.availability === "available";
  const fill = free ? INK : PAPER;
  const line = INK;
  const k = (PIN_SCALE[b.sizeCategory ?? "medium"] ?? 1) * (selected ? 1.34 : 1);
  const w = Math.round(26 * k);
  const h = Math.round(34 * k);
  const pad = selected ? 20 : 6;
  const W = w + pad * 2;
  const H = h + pad * 2;
  const cy = pad + w / 2;

  const halo = selected
    ? `<circle cx="${W / 2}" cy="${cy}" r="${w / 2 + 13}" fill="${PAPER}" fill-opacity="0.92"/>
       <circle cx="${W / 2}" cy="${cy}" r="${w / 2 + 13}" fill="none" stroke="${INK}" stroke-width="1.5"/>`
    : "";

  // a lit board carries a dot; unlit does not
  const core =
    b.lighting === "none"
      ? ""
      : `<circle cx="${W / 2}" cy="${cy}" r="${w * 0.15}" fill="${free ? PAPER : INK}"/>`;

  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <ellipse cx="${W / 2}" cy="${pad + h - 1}" rx="${w * 0.2}" ry="${w * 0.07}" fill="${INK}" fill-opacity="0.18"/>
        ${halo}
        <g transform="translate(${pad} ${pad}) scale(${w / 24} ${h / 32})">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.373 18.627 0 12 0z"
                fill="${fill}" stroke="${line}" stroke-width="${selected ? 3 : 2}" stroke-linejoin="round"
                vector-effect="non-scaling-stroke"/>
        </g>
        ${core}
      </svg>`,
    ),
    anchor: new google.maps.Point(W / 2, pad + h),
    scaledSize: new google.maps.Size(W, H),
  };
}

function donutSegment(cx: number, cy: number, rO: number, rI: number, a0: number, a1: number) {
  const pt = (r: number, a: number) =>
    [cx + r * Math.sin(a), cy - r * Math.cos(a)].map((n) => n.toFixed(2));
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x1, y1] = pt(rO, a0); const [x2, y2] = pt(rO, a1);
  const [x3, y3] = pt(rI, a1); const [x4, y4] = pt(rI, a0);
  return `M${x1} ${y1}A${rO} ${rO} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${rI} ${rI} 0 ${large} 0 ${x4} ${y4}Z`;
}

function cityIcon(free: number, booked: number, scale = 1) {
  const total = free + booked;
  // On a phone the whole region fits at a zoom where full-size donuts collide
  // into one unreadable mass, so they come down with the viewport.
  const d = Math.round((total > 120 ? 74 : total > 60 ? 64 : total > 25 ? 56 : 48) * scale);
  const S = d + 12, c = S / 2, rO = d / 2, rI = d / 2 - Math.max(5, d * 0.115);

  let a = 0;
  const segs = ([["available", free], ["booked", booked]] as const)
    .map(([k, n]) => {
      if (!n) return "";
      const sweep = (n / total) * Math.PI * 2;
      const paint = k === "available" ? PAPER : INK;
      const path =
        n === total
          ? `<circle cx="${c}" cy="${c}" r="${(rO + rI) / 2}" fill="none" stroke="${paint}" stroke-width="${rO - rI}"/>`
          : `<path d="${donutSegment(c, c, rO, rI, a, a + sweep)}" fill="${paint}"/>`;
      a += sweep;
      return path;
    })
    .join("");

  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
        <circle cx="${c}" cy="${c}" r="${rO + 4}" fill="${INK}" fill-opacity="0.14"/>
        <circle cx="${c}" cy="${c}" r="${rI + 0.5}" fill="${INK}"/>
        ${segs}
        <circle cx="${c}" cy="${c}" r="${rO}" fill="none" stroke="${INK}" stroke-width="1.25"/>
      </svg>`,
    ),
    anchor: new google.maps.Point(c, c),
    scaledSize: new google.maps.Size(S, S),
  };
}

/**
 * A desaturated basemap. Google's default tiles are a lot of colour to put
 * behind a black-and-white brand, and the pins have to be the loudest thing
 * on the map — which they are not when they sit on green parks and blue
 * water. Roads keep a little more contrast than everything else, because on
 * this map a road is the product.
 */
const MONO: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: 24 }] },
  { elementType: "labels.text.fill", stylers: [{ saturation: -100 }, { lightness: -28 }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2.5 }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ lightness: 48 }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: 8 }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: -8 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: 62 }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ saturation: -100 }, { lightness: -20 }] },
];

function Layers({
  boards, selected, onSelect, insetLeft,
}: {
  boards: PublicBoard[]; selected: string | null;
  onSelect: (code: string) => void; insetLeft: number;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(8);
  const [iconScale, setIconScale] = useState(1);
  const lastInset = useRef(insetLeft);

  useEffect(() => {
    if (!map) return;
    const l = map.addListener("zoom_changed", () => setZoom(map.getZoom() ?? 8));
    return () => l.remove();
  }, [map]);

  // Follow the filters — the map should show what the rail left behind. Skip
  // while a board is open: fitBounds settles asynchronously and would land
  // after the fly-to below, yanking the view back off the selected board.
  const fit = useCallback(() => {
    if (!map || boards.length === 0) return;
    const b = new google.maps.LatLngBounds();
    for (const x of boards) b.extend({ lat: x.lat, lng: x.lng });
    map.fitBounds(b, { top: 56, right: 56, bottom: 72, left: 56 });
  }, [map, boards]);

  useEffect(() => {
    if (selected) return;
    fit();
    // `selected` is intentionally not a dep — re-fitting when it clears would
    // throw away wherever the user had panned to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit]);

  // The map shares a row with a filter rail whose height is not known until
  // its fonts land. Fitting against the half-built container left Saurashtra
  // pinned to the top of a very tall map with an ocean underneath it. The
  // same measurement sets the marker scale.
  useEffect(() => {
    if (!map) return;
    const el = map.getDiv();
    const measure = () => setIconScale(el.clientWidth < 620 ? 0.62 : el.clientWidth < 900 ? 0.8 : 1);
    const ro = new ResizeObserver(() => { measure(); if (!selected) fit(); });
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [map, fit, selected]);

  useEffect(() => {
    if (!map) return;
    const delta = insetLeft - lastInset.current;
    lastInset.current = insetLeft;
    if (delta !== 0) map.panBy(delta / 2, 0);
  }, [map, insetLeft]);

  useEffect(() => {
    if (!map || !selected) return;
    const b = boards.find((x) => x.code === selected);
    if (!b) return;
    if ((map.getZoom() ?? 0) < 13) map.setZoom(15);
    map.panTo({ lat: b.lat, lng: b.lng });
  }, [map, selected, boards]);

  const cities = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number; free: number; booked: number; n: number }>();
    for (const b of boards) {
      const c = m.get(b.city) ?? { lat: 0, lng: 0, free: 0, booked: 0, n: 0 };
      c.lat += b.lat; c.lng += b.lng; c.n += 1;
      if (b.availability === "available") c.free += 1; else c.booked += 1;
      m.set(b.city, c);
    }
    return [...m.entries()].map(([city, v]) => ({
      city, free: v.free, booked: v.booked, n: v.n, lat: v.lat / v.n, lng: v.lng / v.n,
    }));
  }, [boards]);

  if (!map) return null;

  if (zoom <= CITY_ZOOM_MAX) {
    return (
      <>
        {cities.map((c) => (
          <Marker
            key={c.city}
            position={{ lat: c.lat, lng: c.lng }}
            icon={cityIcon(c.free, c.booked, iconScale)}
            label={{ text: String(c.n), color: "#fff",
                     fontSize: `${Math.round((c.n > 99 ? 15 : 16) * iconScale)}px`,
                     fontWeight: "650", className: "dv-city-label" }}
            title={`${c.city} — ${c.n} sites, ${c.free} free`}
            onClick={() => { map.panTo({ lat: c.lat, lng: c.lng }); map.setZoom(12); }}
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
          key={b.code}
          position={{ lat: b.lat, lng: b.lng }}
          icon={pinIcon(b, b.code === selected)}
          onClick={() => onSelect(b.code)}
          zIndex={b.code === selected ? 999 : 1}
        />
      ))}
    </>
  );
}

export function PublicMap({
  boards, selected, onSelect, insetLeft = 0,
}: {
  boards: PublicBoard[]; selected: string | null;
  onSelect: (code: string) => void; insetLeft?: number;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return (
      <div className="grid size-full place-items-center bg-ink-900">
        <p className="text-subhead text-ink-500">Map key not set</p>
      </div>
    );
  }

  return (
      <GoogleMap
        defaultCenter={{ lat: 21.98, lng: 70.55 }}
        defaultZoom={8}
        minZoom={6}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        styles={MONO}
        style={{ width: "100%", height: "100%" }}
      >
        <Layers boards={boards} selected={selected} onSelect={onSelect} insetLeft={insetLeft} />
      </GoogleMap>
  );
}
