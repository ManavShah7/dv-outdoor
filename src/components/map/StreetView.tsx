"use client";

import { useEffect, useRef, useState } from "react";
import { useApiIsLoaded } from "@vis.gl/react-google-maps";
import { EyeOff } from "lucide-react";

type State = "checking" | "ok" | "none";

/**
 * Interactive Street View at a board's coordinates.
 *
 * Coverage in rural Saurashtra is patchy, so this checks for imagery before
 * rendering and says so plainly when there is none — better than handing
 * someone a grey box and letting them assume the app is broken. It also
 * prefers Google's road capture over nearby user photospheres; see find().
 */
export function StreetView({
  lat,
  lng,
  heading,
  className,
}: {
  lat: number;
  lng: number;
  heading?: number;
  className?: string;
}) {
  const ready = useApiIsLoaded();
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (!ready || !host.current) return;
    let alive = true;

    const svc = new google.maps.StreetViewService();

    /** One lookup. Resolves null unless something was actually captured here. */
    const at = (la: number, ln: number, radius: number) =>
      new Promise<google.maps.StreetViewPanoramaData | null>((res) =>
        svc.getPanorama(
          { location: { lat: la, lng: ln }, radius, source: google.maps.StreetViewSource.OUTDOOR },
          (data, status) =>
            res(
              status === google.maps.StreetViewStatus.OK && data?.location?.latLng ? data : null,
            ),
        ),
      );

    /** Google's own car-captured imagery, as opposed to a user photosphere. */
    const isRoad = (d: google.maps.StreetViewPanoramaData) => /Google/i.test(d.copyright ?? "");

    /**
     * Boards are pinned at the pole, which is often a shopfront or an office —
     * and the nearest panorama there is frequently somebody's uploaded interior.
     * A black or indoor pane reads as a broken app, so walk outward in rings
     * until we hit real road coverage, and only settle for a photosphere if
     * there is genuinely no captured road nearby.
     */
    async function find() {
      const here = await at(lat, lng, 60);
      if (here && isRoad(here)) return here;

      const perDeg = 111_320;
      const lngScale = Math.cos((lat * Math.PI) / 180) || 1;
      for (const metres of [50, 110, 200]) {
        for (let deg = 0; deg < 360; deg += 45) {
          if (!alive) return null;
          const rad = (deg * Math.PI) / 180;
          const hit = await at(
            lat + (metres / perDeg) * Math.cos(rad),
            lng + ((metres / perDeg) * Math.sin(rad)) / lngScale,
            60,
          );
          if (hit && isRoad(hit)) return hit;
        }
      }
      return here ?? (await at(lat, lng, 200));
    }

    find().then((data) => {
      if (!alive || !host.current) return;
      if (!data?.location?.latLng) {
        setState("none");
        return;
      }
      setState("ok");
      new google.maps.StreetViewPanorama(host.current, {
        position: data.location.latLng,
        pov: {
          // face the board from the captured point
          heading:
            heading ??
            google.maps.geometry?.spherical?.computeHeading(
              data.location.latLng,
              new google.maps.LatLng(lat, lng),
            ) ??
            0,
          pitch: 4,
        },
        zoom: 0,
        addressControl: false,
        fullscreenControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        enableCloseButton: false,
        panControl: false,
        zoomControl: true,
      });
    });

    return () => { alive = false; };
  }, [ready, lat, lng, heading]);

  if (state === "none") {
    return (
      <div className={className}>
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[1px]">
          <EyeOff className="size-6 text-white/55" strokeWidth={1.6} />
          <p className="text-[13px] text-white/70">No Street View here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={host} className="size-full" />
      {state === "checking" && (
        <div className="absolute inset-0 animate-pulse" style={{ background: "rgba(120,130,140,.18)" }} />
      )}
    </div>
  );
}
