"use client";

import { useEffect, useMemo } from "react";
import { APIProvider, Map as GoogleMap, useMap, Marker } from "@vis.gl/react-google-maps";
import { PUBLIC_BOARDS } from "@/lib/publicBoards";
import { CITY_CENTRES } from "@/lib/mockBoards";

/** Static coverage view for the landing page — read-only, no interaction UI. */
function Dots() {
  const map = useMap();

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of PUBLIC_BOARDS) counts.set(b.city, (counts.get(b.city) ?? 0) + 1);
    return CITY_CENTRES.map((c) => ({ ...c, n: counts.get(c.city) ?? 0 })).filter((c) => c.n > 0);
  }, []);

  useEffect(() => {
    if (!map) return;
    const b = new google.maps.LatLngBounds();
    for (const c of cities) b.extend({ lat: c.lat, lng: c.lng });
    map.fitBounds(b, 64);
  }, [map, cities]);

  if (!map) return null;

  return (
    <>
      {cities.map((c) => {
        const d = c.n > 120 ? 58 : c.n > 60 ? 50 : c.n > 25 ? 44 : 38;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d + 14}" height="${d + 14}" viewBox="0 0 ${d + 14} ${d + 14}">
          <circle cx="${(d + 14) / 2}" cy="${(d + 14) / 2}" r="${d / 2 + 6}" fill="#0a84ff" fill-opacity="0.18"/>
          <circle cx="${(d + 14) / 2}" cy="${(d + 14) / 2}" r="${d / 2}" fill="#0a84ff" stroke="#fff" stroke-width="2"/>
        </svg>`;
        return (
          <Marker
            key={c.city}
            position={{ lat: c.lat, lng: c.lng }}
            clickable={false}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
              scaledSize: new google.maps.Size(d + 14, d + 14),
              anchor: new google.maps.Point((d + 14) / 2, (d + 14) / 2),
            }}
            label={{ text: String(c.n), color: "#fff", fontSize: "14px", fontWeight: "650", className: "dv-city-label" }}
          />
        );
      })}
    </>
  );
}

export function CoverageMap() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return <div className="h-[420px] w-full animate-pulse bg-chrome-raised" />;
  }

  return (
    <div className="h-[420px] w-full">
      <APIProvider apiKey={key}>
        <GoogleMap
          defaultCenter={{ lat: 21.98, lng: 70.8 }}
          defaultZoom={7.6}
          gestureHandling="none"
          disableDefaultUI
          clickableIcons={false}
          keyboardShortcuts={false}
          styles={[
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          ]}
          style={{ width: "100%", height: "100%" }}
        >
          <Dots />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
