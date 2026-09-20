"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { APIProvider, Map as GoogleMap, useMap, Marker } from "@vis.gl/react-google-maps";
import type { PublicBoard } from "@/lib/publicBoards";

const CITY_ZOOM_MAX = 10.2;

function svgUrl(svg: string) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/** Dark count bubble, as in the reference. */
function clusterIcon(n: number) {
  const d = n > 100 ? 62 : n > 40 ? 54 : n > 15 ? 46 : 40;
  const S = d + 10;
  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
        <circle cx="${S / 2}" cy="${S / 2}" r="${d / 2}" fill="#10161c"/>
      </svg>`,
    ),
    scaledSize: new google.maps.Size(S, S),
    anchor: new google.maps.Point(S / 2, S / 2),
  };
}

function pinIcon(free: boolean, selected: boolean) {
  const c = free ? "#14874a" : "#5b6470";
  const w = selected ? 30 : 24;
  const h = selected ? 39 : 31;
  const P = selected ? 12 : 4;
  const W = w + P * 2, H = h + P * 2;
  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${selected ? `<circle cx="${W / 2}" cy="${P + w / 2}" r="${w / 2 + 9}" fill="${c}" fill-opacity="0.2"/>` : ""}
        <g transform="translate(${P} ${P}) scale(${w / 24} ${h / 32})">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.373 18.627 0 12 0z"
                fill="${c}" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        </g>
        <circle cx="${W / 2}" cy="${P + w / 2}" r="${w * 0.16}" fill="#fff"/>
      </svg>`,
    ),
    scaledSize: new google.maps.Size(W, H),
    anchor: new google.maps.Point(W / 2, P + h),
  };
}

function Layers({
  boards, selected, onSelect,
}: {
  boards: PublicBoard[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(8);
  const fitted = useRef(false);

  useEffect(() => {
    if (!map) return;
    const l = map.addListener("zoom_changed", () => setZoom(map.getZoom() ?? 8));
    return () => l.remove();
  }, [map]);

  // Refit whenever the filtered set changes — the map should follow the filters.
  useEffect(() => {
    if (!map || boards.length === 0) return;
    const b = new google.maps.LatLngBounds();
    for (const x of boards) b.extend({ lat: x.lat, lng: x.lng });
    map.fitBounds(b, 72);
    fitted.current = true;
  }, [map, boards]);

  useEffect(() => {
    if (!map || !selected) return;
    const b = boards.find((x) => x.code === selected);
    if (!b) return;
    if ((map.getZoom() ?? 0) < 13) map.setZoom(15);
    map.panTo({ lat: b.lat, lng: b.lng });
  }, [map, selected, boards]);

  const clusters = useMemo(() => {
    const byCity = new Map<string, { lat: number; lng: number; n: number }>();
    for (const b of boards) {
      const c = byCity.get(b.city);
      if (c) { c.lat += b.lat; c.lng += b.lng; c.n += 1; }
      else byCity.set(b.city, { lat: b.lat, lng: b.lng, n: 1 });
    }
    return [...byCity.entries()].map(([city, v]) => ({
      city, n: v.n, lat: v.lat / v.n, lng: v.lng / v.n,
    }));
  }, [boards]);

  if (!map) return null;

  if (zoom <= CITY_ZOOM_MAX) {
    return (
      <>
        {clusters.map((c) => (
          <Marker
            key={c.city}
            position={{ lat: c.lat, lng: c.lng }}
            icon={clusterIcon(c.n)}
            label={{ text: `${c.n}+`, color: "#fff", fontSize: "14px", fontWeight: "650", className: "dv-city-label" }}
            title={`${c.city} — ${c.n} sites`}
            onClick={() => { map.panTo({ lat: c.lat, lng: c.lng }); map.setZoom(12); }}
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
          icon={pinIcon(b.availability === "available", b.code === selected)}
          onClick={() => onSelect(b.code)}
          zIndex={b.code === selected ? 999 : 1}
        />
      ))}
    </>
  );
}

export function PublicMap({
  boards, selected, onSelect,
}: {
  boards: PublicBoard[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return (
      <div className="grid size-full place-items-center" style={{ background: "var(--s-bg-sunk)" }}>
        <p className="text-[14px]" style={{ color: "var(--s-text-soft)" }}>Map key not set</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={key}>
      <GoogleMap
        defaultCenter={{ lat: 21.98, lng: 70.8 }}
        defaultZoom={8}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        styles={[
          { elementType: "geometry", stylers: [{ color: "#f4f5f6" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
          { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#dfe6ea" }] },
          { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#eef0f1" }] },
        ]}
        style={{ width: "100%", height: "100%" }}
      >
        <Layers boards={boards} selected={selected} onSelect={onSelect} />
      </GoogleMap>
    </APIProvider>
  );
}
