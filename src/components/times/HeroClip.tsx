"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The hero clip: muted, looping, no controls, with its own first frame as
 * the poster so the band is never empty while 2.3 MB arrives — and so there
 * is still something there for anyone whose browser blocks autoplay.
 * `playsInline` is what stops iOS taking it full screen.
 *
 * Someone who has asked their system for less motion gets the poster and
 * nothing that moves. A video element with `autoPlay` starts regardless of
 * that setting, and CSS cannot stop playback, so the choice has to be made
 * here — which is the only reason this is a client component.
 */
export function HeroClip({ src, poster, alt }: {
  src: string; poster: string; alt: string;
}) {
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);
  const still = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false, // the server cannot know; the video is the common case
  );

  return (
    <>
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage
        <img src={poster} alt={alt} />
      ) : (
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={alt}
        />
      )}
    </>
  );
}
