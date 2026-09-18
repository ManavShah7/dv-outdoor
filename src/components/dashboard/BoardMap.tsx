"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STATUS_META } from "@/lib/boards";
import type { Board, BoardStatus } from "@/lib/types/database";

// Duplicated from globals.css: MapLibre paint expressions run in WebGL and
// can't read CSS custom properties, so these hex values must be kept in sync
// with the --status-* tokens by hand.
const STATUS_HEX: Record<BoardStatus, string> = {
  available: "#15803d",
  booked: "#1d4ed8",
  under_maintenance: "#b45309",
  damaged: "#b91c1c",
  pending_installation: "#64748b",
};

const GUJARAT_CENTER: [number, number] = [71.5, 22.4];

function boardsToGeoJSON(boards: Board[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: boards.map((board) => ({
      type: "Feature",
      id: board.id,
      geometry: { type: "Point", coordinates: [board.lng, board.lat] },
      properties: {
        id: board.id,
        code: board.code,
        name: board.name,
        status: board.status,
        color: STATUS_HEX[board.status],
      },
    })),
  };
}

export function BoardMap({ boards }: { boards: Board[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const boardsRef = useRef(boards);

  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);

  // Create the map once. The 'load' handler reads from boardsRef so the
  // initial paint always reflects the latest props even if this effect ran
  // before the first render's data arrived.
  useEffect(() => {
    if (!containerRef.current) return;

    // MapLibre v6 loads its tile-parsing worker as a separate module file
    // rather than an inlined blob. Next.js's bundler can't discover that
    // file automatically, so without this the worker 404s silently — no
    // 'error' event, no thrown exception, tiles just never arrive. The file
    // is copied to public/ by scripts/copy-maplibre-worker.mjs (postinstall).
    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: GUJARAT_CENTER,
      zoom: 6.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => console.error("MapLibre error:", e.error?.message));
    map.on("load", () => {
      map.addSource("boards", {
        type: "geojson",
        data: boardsToGeoJSON(boardsRef.current),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 45,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "boards",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#16181a",
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 26],
          "circle-opacity": 0.85,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "boards",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Medium"],
          "text-size": 12,
        },
        paint: { "text-color": "#faf9f7" },
      });

      map.addLayer({
        id: "board-points",
        type: "circle",
        source: "boards",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "clusters", async (e: maplibregl.MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("boards") as maplibregl.GeoJSONSource;
        if (clusterId == null) return;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
          zoom,
        });
      });

      map.on("click", "board-points", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const { id, code, name, status } = feature.properties as {
          id: string;
          code: string;
          name: string;
          status: BoardStatus;
        };

        new maplibregl.Popup({ offset: 12, closeButton: false })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(
            `<div style="font-family:var(--font-sans);min-width:160px">
               <p style="font-size:13px;font-weight:600;color:#16181a;margin:0 0 2px">${name}</p>
               <p style="font-size:11px;color:#6b6f76;margin:0 0 6px">${code} · ${STATUS_META[status].label}</p>
               <a href="/boards/${id}" style="font-size:12px;font-weight:500;color:#0e7c7b">View board →</a>
             </div>`,
          )
          .addTo(map);
      });

      map.on("mouseenter", "board-points", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "board-points", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Keep the rendered points in sync whenever the boards prop changes
  // (e.g. a status-filter chip is toggled) without recreating the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncData = () => {
      const source = map.getSource("boards") as maplibregl.GeoJSONSource | undefined;
      source?.setData(boardsToGeoJSON(boards));
    };

    if (map.isStyleLoaded() && map.getSource("boards")) {
      syncData();
    } else {
      map.once("load", syncData);
    }
  }, [boards]);

  return <div ref={containerRef} className="h-[520px] w-full rounded-2xl" />;
}
