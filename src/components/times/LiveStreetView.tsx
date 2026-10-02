"use client";

import { useState } from "react";
import { Expand, X } from "lucide-react";
import { MapsProvider } from "@/components/map/MapsProvider";
import { StreetView } from "@/components/map/StreetView";

/**
 * A real panorama on the landing page, standing at one of the Junagadh
 * boards, rather than a photograph of one.
 *
 * The claim in this band is "see it live, before it's actually live" — a
 * still image cannot make that argument, and the visitor finding out they
 * can drag it is the argument.
 */
export function LiveStreetView({
  lat, lng, caption,
}: {
  lat: number; lng: number; caption: string;
}) {
  const [full, setFull] = useState(false);

  return (
    <MapsProvider>
      <div className="ed-live ed-live--pano">
        <StreetView lat={lat} lng={lng} className="absolute inset-0" />
        <button className="ed-live__act" onClick={() => setFull(true)}>
          <Expand className="size-4" strokeWidth={2.4} />
          Full screen
        </button>
        <span className="ed-live__pill">{caption}</span>
      </div>

      {full && (
        <div className="ed-fullscreen">
          <div className="ed-fullscreen__bar">
            <span className="ed-fullscreen__title">{caption}</span>
            <button className="ed-fullscreen__close" onClick={() => setFull(false)}>
              <X className="size-4" strokeWidth={2.4} /> Close
            </button>
          </div>
          <div className="ed-fullscreen__stage">
            <StreetView lat={lat} lng={lng} className="absolute inset-0" />
          </div>
        </div>
      )}
    </MapsProvider>
  );
}
