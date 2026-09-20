"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

/**
 * Loads the Maps JS API once for a whole surface, not just the map component.
 * Street View lives in a side panel, outside the map — with the provider
 * wrapped around only the map, useApiIsLoaded() there stays false forever and
 * the panorama silently never renders.
 */
export function MapsProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return <>{children}</>;
  return (
    <APIProvider apiKey={key} libraries={["geometry"]}>
      {children}
    </APIProvider>
  );
}
