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

function pinIcon(color: string, selected: boolean) {
  const r = selected ? 9 : 6.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="${r + 4}" fill="${color}" fill-opacity="${selected ? 0.28 : 0.16}"/>
    <circle cx="17" cy="17" r="${r}" fill="${color}" stroke="#fff" stroke-width="${selected ? 3 : 2}"/>
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(34, 34),
    anchor: new google.maps.Point(17, 17),
  };
}

function cityIcon(count: number) {
  const d = count > 120 ? 62 : count > 60 ? 54 : count > 25 ? 46 : 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d + 16}" height="${d + 16}" viewBox="0 0 ${d + 16} ${d + 16}">
    <circle cx="${(d + 16) / 2}" cy="${(d + 16) / 2}" r="${d / 2 + 7}" fill="#0a84ff" fill-opacity="0.16"/>
    <circle cx="${(d + 16) / 2}" cy="${(d + 16) / 2}" r="${d / 2}" fill="#0a84ff" stroke="#fff" stroke-width="2.5"/>
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(d + 16, d + 16),
    anchor: new google.maps.Point((d + 16) / 2, (d + 16) / 2),
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
    const counts = new Map<string, number>();
    for (const b of boards) counts.set(b.city, (counts.get(b.city) ?? 0) + 1);
    return CITY_CENTRES.map((c) => ({ ...c, count: counts.get(c.city) ?? 0 })).filter((c) => c.count > 0);
  }, [boards]);

  if (!map) return null;

  if (zoom <= CITY_ZOOM_MAX) {
    return (
      <>
        {cityCounts.map((c) => (
          <Marker
            key={c.city}
            position={{ lat: c.lat, lng: c.lng }}
            icon={cityIcon(c.count)}
            label={{
              text: String(c.count),
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "700",
            }}
            title={`${c.city} — ${c.count} boards`}
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
          icon={pinIcon(STATUS_COLOR[b.status], b.id === selectedId)}
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
