"use client";

import { useEffect, useState } from "react";
import { Map as GoogleMap } from "@vis.gl/react-google-maps";
import { MapsProvider } from "@/components/map/MapsProvider";
import { DeckLayers } from "@/components/map/DeckLayers";
import { loadPopulation, type Cell } from "@/components/map/PopulationLayer";

/** Desaturated basemap so the hexagons are the only colour on it. */
const MONO: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: 22 }] },
  { elementType: "labels.text.fill", stylers: [{ saturation: -100 }, { lightness: -26 }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2.5 }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: 60 }] },
];

/**
 * Population density across Saurashtra, live on the map rather than a
 * screenshot of one. The layer itself is shared with the inventory map —
 * see PopulationLayer.
 */
export function LiveHeatmap({ lat, lng, zoom = 12 }: { lat: number; lng: number; zoom?: number }) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadPopulation()
      .then((c) => alive && setCells(c))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  return (
    <MapsProvider>
      <div className="tm-live">
        <GoogleMap
          defaultCenter={{ lat, lng }}
          defaultZoom={zoom}
          minZoom={7}
          maxZoom={15}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          styles={MONO}
          style={{ width: "100%", height: "100%" }}
        >
          <DeckLayers population={cells} />
        </GoogleMap>
        <span className="tm-live__cap">
          {failed
            ? "Population data unavailable"
            : cells.length
              ? "People per 400m · Kontur (CC BY)"
              : "Loading population data…"}
        </span>
      </div>
    </MapsProvider>
  );
}
