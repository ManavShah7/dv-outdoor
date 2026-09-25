"use client";

import { useEffect, useState } from "react";
import { Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { MapsProvider } from "@/components/map/MapsProvider";
import { assetUrl } from "@/lib/assets";

type Cell = [string, number];

/** Warm ramp, transparent through amber to a deep red — the same one the
 *  first render used, so the band still looks like the artwork. */
const STOPS: [number, [number, number, number]][] = [
  [0.0, [255, 244, 190]],
  [0.45, [255, 170, 60]],
  [0.75, [235, 70, 45]],
  [1.0, [140, 10, 30]],
];

function ramp(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i];
    const [b, cb] = STOPS[i + 1];
    if (x >= a && x <= b) {
      const f = b === a ? 0 : (x - a) / (b - a);
      return [
        Math.round(ca[0] + (cb[0] - ca[0]) * f),
        Math.round(ca[1] + (cb[1] - ca[1]) * f),
        Math.round(ca[2] + (cb[2] - ca[2]) * f),
      ];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

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

function Hexes({ cells }: { cells: Cell[] }) {
  const map = useMap();
  // One overlay for the life of the component. Creating it inside the effect
  // meant StrictMode's mount/unmount/mount tore it down while Google was
  // still queuing onAdd, and deck then called addListener on a null map.
  const [overlay] = useState(() => new GoogleMapsOverlay({ interleaved: false }));

  useEffect(() => {
    if (!map) return;
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, overlay]);

  // Depends on the overlay too: the data usually lands before the map does,
  // and keying only on `cells` meant the layer was set on nothing and never
  // set again.
  useEffect(() => {
    if (!cells.length) return;
    // Scale against a high percentile rather than the single densest cell —
    // one outlier hex would otherwise flatten every city to pale yellow.
    const sorted = cells.map((c) => c[1]).sort((a, b) => a - b);
    const peak = sorted[Math.floor(sorted.length * 0.995)] || 1;

    overlay.setProps({
      layers: [
        new H3HexagonLayer<Cell>({
          id: "population",
          data: cells,
          getHexagon: (d) => d[0],
          extruded: false,
          filled: true,
          stroked: false,
          highPrecision: false,
          pickable: false,
          getFillColor: (d) => {
            const t = Math.pow(Math.min(1, d[1] / peak), 0.55);
            const [r, g, b] = ramp(t);
            return [r, g, b, Math.round(40 + 165 * t)];
          },
        }),
      ],
    });
  }, [overlay, cells]);

  return null;
}

/**
 * Population density across Saurashtra, 400m hexagons, live on the map
 * rather than a screenshot of one.
 *
 * The data is Kontur's, which fuses GHSL, Meta's settlement layer and
 * Microsoft building footprints. CC-BY, so the credit below is an obligation
 * and not decoration. All 56,948 cells are about 234 KB over the wire, which
 * is why the whole region ships rather than one city — panning to Junagadh
 * should not need another request.
 */
export function LiveHeatmap({ lat, lng, zoom = 12 }: { lat: number; lng: number; zoom?: number }) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(assetUrl("data/pop-saurashtra.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { cells: Cell[] }) => alive && setCells(d.cells))
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
          <Hexes cells={cells} />
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
