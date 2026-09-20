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
 * someone a grey box and letting them assume the app is broken. The search
 * radius is generous because the nearest captured road is often not the exact
 * pole location.
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
    svc.getPanorama({ location: { lat, lng }, radius: 120 }, (data, status) => {
      if (!alive || !host.current) return;
      if (status !== google.maps.StreetViewStatus.OK || !data?.location?.latLng) {
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
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-black/30">
          <EyeOff className="size-6 text-ink-600" strokeWidth={1.6} />
          <p className="text-footnote text-ink-500">No Street View here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={host} className="size-full" />
      {state === "checking" && (
        <div className="absolute inset-0 animate-pulse bg-chrome-raised" />
      )}
    </div>
  );
}
