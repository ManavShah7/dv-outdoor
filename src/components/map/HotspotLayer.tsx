"use client";

import { useMemo } from "react";
import { Marker, useMap } from "@vis.gl/react-google-maps";
import type { Hotspot, HotspotKind } from "@/lib/hotspots.db";

/**
 * The context layer: junctions, stations, markets, colleges, landmarks.
 *
 * Deliberately quiet. These explain why a board is worth something, so they
 * must never out-shout the boards themselves — small, dark grey, no fill
 * colour competing with the green and red pins.
 *
 * Thinned by zoom as well as weight. There are roughly 1,800 of these across
 * Saurashtra and drawing them all at once turns the map into confetti; at
 * city zoom you get only the things that matter, and the rest arrive as you
 * go in.
 */

/** Simple glyphs — a shape read at 11px beats an illustration. */
const GLYPH: Record<HotspotKind, string> = {
  junction:    '<path d="M11 3v16M3 11h16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
  station:     '<rect x="6" y="5" width="10" height="9" rx="2" fill="#fff"/><path d="M7 17l-1.5 2M15 17l1.5 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  market:      '<path d="M4 9h14l-1 9H5L4 9z" fill="#fff"/><path d="M8 9V6a3 3 0 016 0v3" stroke="#fff" stroke-width="2" fill="none"/>',
  mall:        '<path d="M5 8h12v10H5z" fill="#fff"/><path d="M9 8V6a2 2 0 014 0v2" stroke="#fff" stroke-width="2" fill="none"/>',
  college:     '<path d="M11 5l8 4-8 4-8-4 8-4z" fill="#fff"/><path d="M6 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" stroke="#fff" stroke-width="2" fill="none"/>',
  hospital:    '<path d="M9 4h4v5h5v4h-5v5H9v-5H4V9h5V4z" fill="#fff"/>',
  temple:      '<path d="M11 3l6 6H5l6-6z" fill="#fff"/><path d="M6 10h10v8H6z" fill="#fff"/>',
  landmark:    '<path d="M11 3l2.2 5.4L19 9l-4 3.9 1 5.6-5-2.8-5 2.8 1-5.6L3 9l5.8-.6L11 3z" fill="#fff"/>',
  beach:       '<path d="M3 16c2.5-2 5.5-2 8 0s5.5 2 8 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="11" cy="8" r="3.4" fill="#fff"/>',
  stadium:     '<ellipse cx="11" cy="11" rx="8" ry="5.4" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="11" cy="11" r="1.8" fill="#fff"/>',
  cinema:      '<rect x="4" y="6" width="14" height="10" rx="2" fill="#fff"/><path d="M8 6v10M14 6v10" stroke="#111" stroke-width="1.6"/>',
  high_street: '<path d="M11 3v16" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 3"/>',
  other:       '<circle cx="11" cy="11" r="4" fill="#fff"/>',
};

const LABEL: Record<HotspotKind, string> = {
  junction: "Junction", station: "Station", market: "Market", mall: "Mall",
  college: "College", hospital: "Hospital", temple: "Temple", landmark: "Landmark",
  beach: "Beach", stadium: "Stadium", cinema: "Cinema", high_street: "High street",
  other: "Landmark",
};

function icon(h: Hotspot) {
  // weight drives size, so the busiest junction reads first at a glance
  const d = 18 + h.weight * 2.2;
  const S = d + 6;
  const c = S / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
    `<circle cx="${c}" cy="${c}" r="${d / 2}" fill="#1b1f24" fill-opacity="0.88" stroke="#fff" stroke-width="1.5"/>` +
    `<g transform="translate(${c - 11} ${c - 11}) scale(${d / 30})">${GLYPH[h.kind] ?? GLYPH.other}</g>` +
    `</svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    anchor: new google.maps.Point(c, c),
    scaledSize: new google.maps.Size(S, S),
  };
}

export function HotspotLayer({
  hotspots, zoom, onSelect,
}: {
  hotspots: Hotspot[];
  zoom: number;
  onSelect?: (h: Hotspot) => void;
}) {
  const map = useMap();

  const shown = useMemo(() => {
    // Below city zoom the layer is noise, and at region zoom it is confetti.
    if (zoom < 11) return [];
    const floor = zoom < 12 ? 5 : zoom < 13 ? 4 : zoom < 14.5 ? 3 : 1;
    return hotspots.filter((h) => h.weight >= floor);
  }, [hotspots, zoom]);

  if (!map) return null;

  return (
    <>
      {shown.map((h) => (
        <Marker
          key={h.id}
          position={{ lat: h.lat, lng: h.lng }}
          icon={icon(h)}
          title={`${h.name} — ${LABEL[h.kind] ?? h.kind}`}
          onClick={onSelect ? () => onSelect(h) : undefined}
          clickable={!!onSelect}
          zIndex={5}
        />
      ))}
    </>
  );
}

export { LABEL as HOTSPOT_LABEL };
