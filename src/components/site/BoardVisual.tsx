"use client";

import { useEffect, useState } from "react";
import { Expand, ImageOff, X } from "lucide-react";
import { StreetView } from "@/components/map/StreetView";

type Mode = "photo" | "street";

function Modes({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="tmui-seg">
      {(["photo", "street"] as const).map((m) => (
        <button key={m} aria-pressed={mode === m} onClick={() => onChange(m)}>
          {m === "photo" ? "Photo" : "Street view"}
        </button>
      ))}
    </div>
  );
}

/** Hoisted: declared inside BoardVisual it would be a new component type on
 *  every render, and Street View would remount — and re-bill — each time. */
function Visual({
  mode, lat, lng, photoUrl, title,
}: {
  mode: Mode; lat: number; lng: number; photoUrl?: string | null; title?: string;
}) {
  if (mode === "street") return <StreetView lat={lat} lng={lng} className="absolute inset-0" />;
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- remote asset, no loader needed
    return <img src={photoUrl} alt={title ?? ""} />;
  }
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2" style={{ background: "#efefef" }}>
      <ImageOff className="size-6" strokeWidth={1.6} style={{ opacity: 0.4 }} />
      <p className="tmui-caps" style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.5 }}>Photo coming soon</p>
    </div>
  );
}

/**
 * The board's visual: the photograph, or Street View at the pole.
 *
 * Only one of the two ever mounts. The previous version shared one element
 * between the inline frame and the full-screen overlay, so opening full
 * screen in Street View left two panoramas running at once — twice the
 * tiles, and Google bills per panorama load.
 *
 * Full screen matters most for Street View: a 427px rail is no way to judge
 * whether a driver can actually see a board, so the control is a labelled
 * button rather than a bare icon, and it goes full-bleed.
 */
export function BoardVisual({
  lat, lng, photoUrl, title,
}: {
  lat: number; lng: number; photoUrl?: string | null; title?: string;
}) {
  const [mode, setMode] = useState<Mode>("photo");
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    // the page behind should not scroll while a full-screen view is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [full]);

  if (full) {
    return (
      <div className="tmui-full tmui">
        <div className="tmui-full__bar">
          <Modes mode={mode} onChange={setMode} />
          <span className="tmui-full__title hidden sm:block">{title}</span>
          <button className="tmui-ghost" onClick={() => setFull(false)}>
            <X className="size-4" strokeWidth={2.4} /> Close
          </button>
        </div>
        <div className="tmui-full__stage">
          <Visual mode={mode} lat={lat} lng={lng} photoUrl={photoUrl} title={title} />
        </div>
      </div>
    );
  }

  return (
    <div className="tmui-visual">
      <Visual mode={mode} lat={lat} lng={lng} photoUrl={photoUrl} title={title} />
      <div className="tmui-visual__bar">
        <Modes mode={mode} onChange={setMode} />
        <button className="tmui-ghost" onClick={() => setFull(true)} style={{ height: 32, paddingInline: 12, fontSize: 11.5 }}>
          <Expand className="size-3.5" strokeWidth={2.4} />
          Full screen
        </button>
      </div>
    </div>
  );
}
