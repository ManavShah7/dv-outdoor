"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { STATUS_META } from "@/lib/boards";
import type { Board, BoardStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

// Duplicated from globals.css since marker icons are drawn on canvas and
// can't read CSS custom properties — keep in sync with the --status-* tokens.
const STATUS_HEX: Record<BoardStatus, string> = {
  available: "#34d399",
  booked: "#60a5fa",
  under_maintenance: "#fbbf24",
  damaged: "#f87171",
  pending_installation: "#9aa1ac",
};

// A restrained near-black map style (Apple Maps/Uber-style dark mode) —
// muted geometry, minimal label noise, so the colored board pins are the
// only thing that really pops.
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f1115" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f1115" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7d8391" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2e37" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#8b909c" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c7cad1" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7d8391" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#161a1f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#22262e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1d23" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7078" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c313a" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#9aa0ab" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1c2027" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060a10" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4c5560" }] },
];

// Saurashtra-focused by default; panning/zooming out reaches the rest of
// Gujarat and beyond — nothing restricts the viewport.
const SAURASHTRA_CENTER = { lat: 21.9, lng: 70.7 };
const DEFAULT_ZOOM = 8;

function BoardMarkers({
  boards,
  onSelect,
}: {
  boards: Board[];
  onSelect: (board: Board) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    clustererRef.current = new MarkerClusterer({ map });
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!map || !clusterer) return;

    clusterer.clearMarkers();

    const markers = boards.map((board) => {
      const marker = new google.maps.Marker({
        position: { lat: board.lat, lng: board.lng },
        title: board.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: STATUS_HEX[board.status],
          fillOpacity: 1,
          strokeColor: "#0f1115",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => onSelect(board));
      return marker;
    });

    clusterer.addMarkers(markers);
  }, [map, boards, onSelect]);

  return null;
}

export function BoardMap({ boards, className }: { boards: Board[]; className?: string }) {
  const [selected, setSelected] = useState<Board | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={cn("flex items-center justify-center bg-foreground/[0.03] text-sm text-muted", className)}>
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to see the map.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={SAURASHTRA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        styles={DARK_MAP_STYLE}
        className={className}
      >
        <BoardMarkers boards={boards} onSelect={setSelected} />
        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ minWidth: 160, fontFamily: "var(--font-sans)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#f2f3f5" }}>
                {selected.name}
              </p>
              <p style={{ fontSize: 11, color: "#8b8e96", margin: "0 0 6px" }}>
                {selected.code} · {STATUS_META[selected.status].label}
              </p>
              <a
                href={`/boards/${selected.id}`}
                style={{ fontSize: 12, fontWeight: 500, color: "#2dd4bf" }}
              >
                View board →
              </a>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
