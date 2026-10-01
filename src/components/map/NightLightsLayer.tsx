"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useMap } from "@vis.gl/react-google-maps";

/**
 * Saurashtra at night, from space.
 *
 * NASA's VIIRS Black Marble: the Suomi-NPP satellite's Day/Night Band, which
 * measures how much light a place actually emits after dark. For outdoor
 * advertising it is the most honest open proxy for commercial activity there
 * is — markets, highways and lit frontage glow, and farmland does not. It is
 * also the one layer here that shows the corridors *between* towns, which is
 * where a lot of this inventory sits.
 *
 * Served straight off NASA GIBS as web-mercator tiles, so there is no raster
 * pipeline and no key: this is an ImageMapType and nothing else.
 *
 * The honest limit is resolution. The Day/Night Band is 463m at nadir and
 * GIBS publishes it to zoom 8 only, so it answers "is this a lit district"
 * and cannot answer "is this corner brighter than that one". Past the zoom
 * where it means something the layer takes itself off the map rather than
 * being upscaled into a blur that implies precision it does not have — at
 * z15 a z8 tile is stretched 128 times and you can count the sensor pixels.
 *
 * Setting `maxZoom` on the ImageMapType is not enough to get that: Google
 * reads it as "this is the deepest level I have tiles for" and goes on
 * stretching the last one it got. The overlay has to be detached by hand.
 */

const GIBS =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble" +
  "/default/2016-01-01/GoogleMapsCompatible_Level8";

/** The last zoom GIBS actually publishes for this product. */
const NATIVE_MAX = 8;
/** Past this the pixels are bigger than the thing being looked at. */
const USEFUL_MAX = 11;

export function NightLightsLayer({
  on,
  /** Told when the layer withdraws itself, so the key can say why. */
  onShownChange,
}: {
  on: boolean;
  onShownChange?: (shown: boolean) => void;
}) {
  const map = useMap();

  // The zoom lives on the Google map, not in React.
  const subscribe = useCallback((cb: () => void) => {
    if (!map) return () => {};
    const l = map.addListener("zoom_changed", cb);
    return () => l.remove();
  }, [map]);
  const zoom = useSyncExternalStore(subscribe, () => map?.getZoom() ?? 8, () => 8);
  const shown = on && zoom <= USEFUL_MAX;

  useEffect(() => { onShownChange?.(shown); }, [shown, onShownChange]);

  useEffect(() => {
    if (!map || !shown) return;

    const type = new google.maps.ImageMapType({
      name: "Night lights",
      tileSize: new google.maps.Size(256, 256),
      minZoom: 1,
      maxZoom: USEFUL_MAX,
      opacity: 0.78,
      // Above the native maximum, keep asking for the z8 tile that contains
      // the view: Google will scale it, which is the same thing it does for
      // its own imagery and better than a hole in the map.
      getTileUrl: ({ x, y }, z) => {
        if (z <= NATIVE_MAX) return `${GIBS}/${z}/${y}/${x}.png`;
        const k = 2 ** (z - NATIVE_MAX);
        return `${GIBS}/${NATIVE_MAX}/${Math.floor(y / k)}/${Math.floor(x / k)}.png`;
      },
    });

    map.overlayMapTypes.push(type);
    return () => {
      // Find it by identity rather than by index: another layer may have been
      // pushed or popped in between, and removing the wrong one is silent.
      const i = map.overlayMapTypes.getArray().indexOf(type);
      if (i >= 0) map.overlayMapTypes.removeAt(i);
    };
  }, [map, shown]);

  return null;
}

export { USEFUL_MAX as NIGHT_USEFUL_MAX };
