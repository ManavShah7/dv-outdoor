"use client";

import { useMemo, useState } from "react";
import { Marker, useMap } from "@vis.gl/react-google-maps";
import type { Hotspot, HotspotKind } from "@/lib/hotspots.db";

/**
 * The context layer: junctions, stations, markets, colleges, landmarks.
 *
 * These explain why a board is worth something, so they have to be legible —
 * the first pass drew them dark grey on a desaturated grey basemap and they
 * disappeared into it. White disc, black glyph, black ring: maximum contrast
 * on a light map, and still monochrome so the green and red board pins keep
 * the colour to themselves.
 *
 * Thinned by zoom as well as weight. There are 423 of these across
 * Saurashtra; drawing them all at once turns the map into confetti.
 */

/** Simple glyphs — a shape read at 14px beats an illustration. */
const GLYPH: Record<HotspotKind, string> = {
  junction:    '<path d="M12 3v18M3 12h18" stroke="#000" stroke-width="3.2" stroke-linecap="round"/>',
  station:     '<rect x="6" y="4" width="12" height="11" rx="2.5" fill="#000"/><path d="M8 18l-2 3M16 18l2 3" stroke="#000" stroke-width="2.6" stroke-linecap="round"/>',
  market:      '<path d="M4 9h16l-1.5 11h-13L4 9z" fill="#000"/><path d="M9 9V6.5a3 3 0 016 0V9" stroke="#000" stroke-width="2.4" fill="none"/>',
  mall:        '<path d="M5 8h14v12H5z" fill="#000"/><path d="M9.5 8V6a2.5 2.5 0 015 0v2" stroke="#000" stroke-width="2.4" fill="none"/>',
  college:     '<path d="M12 4l9 4.5-9 4.5-9-4.5L12 4z" fill="#000"/><path d="M6.5 11v4.2c0 1.9 2.5 3.3 5.5 3.3s5.5-1.4 5.5-3.3V11" stroke="#000" stroke-width="2.4" fill="none"/>',
  hospital:    '<path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5V3z" fill="#000"/>',
  temple:      '<path d="M12 2.5l7 7H5l7-7z" fill="#000"/><path d="M6.5 11h11v9.5h-11z" fill="#000"/>',
  landmark:    '<path d="M12 2.5l2.6 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.8l-5.8 3.7 1.6-6.6L2.6 9.4l6.8-.6L12 2.5z" fill="#000"/>',
  beach:       '<path d="M3 18c3-2.4 6-2.4 9 0s6 2.4 9 0" stroke="#000" stroke-width="2.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="8.5" r="4" fill="#000"/>',
  stadium:     '<ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke="#000" stroke-width="3"/><circle cx="12" cy="12" r="2.2" fill="#000"/>',
  cinema:      '<rect x="3.5" y="6" width="17" height="12" rx="2" fill="#000"/><path d="M8.5 6v12M15.5 6v12" stroke="#fff" stroke-width="2"/>',
  high_street: '<path d="M12 3v18" stroke="#000" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="4 4"/>',
  other:       '<circle cx="12" cy="12" r="5" fill="#000"/>',
};

const LABEL: Record<HotspotKind, string> = {
  junction: "Junction", station: "Station", market: "Market", mall: "Mall",
  college: "College", hospital: "Hospital", temple: "Temple", landmark: "Landmark",
  beach: "Beach", stadium: "Stadium", cinema: "Cinema", high_street: "High street",
  other: "Landmark",
};

function icon(h: Hotspot, hot: boolean) {
  const d = (26 + h.weight * 3) * (hot ? 1.18 : 1);
  const pad = 5;
  const S = d + pad * 2;
  const c = S / 2;
  const g = d * 0.56;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
    `<circle cx="${c}" cy="${c + 1}" r="${d / 2}" fill="#000" fill-opacity="0.18"/>` +
    `<circle cx="${c}" cy="${c}" r="${d / 2}" fill="#fff" stroke="#000" stroke-width="${hot ? 3 : 2.2}"/>` +
    `<g transform="translate(${c - g / 2} ${c - g / 2}) scale(${g / 24})">${GLYPH[h.kind] ?? GLYPH.other}</g>` +
    `</svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    anchor: new google.maps.Point(c, c),
    scaledSize: new google.maps.Size(S, S),
  };
}

type Hover = { h: Hotspot; x: number; y: number };

export function HotspotLayer({
  hotspots, zoom, onSelect,
}: {
  hotspots: Hotspot[];
  zoom: number;
  onSelect?: (h: Hotspot) => void;
}) {
  const map = useMap();
  const [hover, setHover] = useState<Hover | null>(null);

  const shown = useMemo(() => {
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
          icon={icon(h, hover?.h.id === h.id)}
          clickable
          onClick={onSelect ? () => onSelect(h) : undefined}
          // The card follows the cursor rather than the marker: getting screen
          // coordinates out of a lat/lng needs the overlay projection, and the
          // pointer event already carries them.
          onMouseOver={(e) => {
            const d = e.domEvent as MouseEvent;
            setHover({ h, x: d.clientX, y: d.clientY });
          }}
          onMouseOut={() => setHover((c) => (c?.h.id === h.id ? null : c))}
          zIndex={hover?.h.id === h.id ? 20 : 5}
        />
      ))}

      {hover && <HoverCard hover={hover} />}
    </>
  );
}

function HoverCard({ hover }: { hover: Hover }) {
  const { h, x, y } = hover;
  // flip to the other side near the edges so the card never runs off screen
  const flipX = typeof window !== "undefined" && x > window.innerWidth - 300;
  const flipY = typeof window !== "undefined" && y > window.innerHeight - 190;

  return (
    // Styled inline rather than through the .tmui scope: this renders on the
    // admin map too, where that scope and its font variable do not exist.
    <div
      className="pointer-events-none fixed z-[60] w-[268px] p-3.5"
      style={{
        left: flipX ? x - 280 : x + 16,
        top: flipY ? y - 168 : y + 14,
        background: "#fff",
        color: "#000",
        border: "1px solid #000",
        boxShadow: "6px 6px 0 rgba(0,0,0,.14)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <p
        className="tmui-caps"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", opacity: 0.55 }}
      >
        {LABEL[h.kind] ?? h.kind} · {h.city}
      </p>
      <p className="mt-1.5" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>
        {h.name}
      </p>

      <div className="mt-3 flex items-center gap-2" style={{ fontSize: 11.5 }}>
        <span className="tmui-caps" style={{ fontWeight: 600, opacity: 0.55, letterSpacing: ".05em" }}>
          Pull
        </span>
        <span className="flex gap-[3px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              style={{
                width: 13, height: 5,
                background: i <= h.weight ? "#000" : "rgba(0,0,0,.16)",
              }}
            />
          ))}
        </span>
        <span className="tabular-nums" style={{ opacity: 0.55 }}>
          reaches {h.radiusM} m
        </span>
      </div>

      {h.notes && (
        <p className="mt-2.5" style={{ fontSize: 11.5, lineHeight: 1.45, opacity: 0.7 }}>
          {h.notes}
        </p>
      )}
      {h.source === "osm" && !h.notes && (
        <p className="mt-2.5" style={{ fontSize: 11, lineHeight: 1.4, opacity: 0.45 }}>
          From OpenStreetMap — rename or re-weight it in the office.
        </p>
      )}
    </div>
  );
}

export { LABEL as HOTSPOT_LABEL };
