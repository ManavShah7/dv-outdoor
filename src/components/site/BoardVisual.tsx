"use client";

import { useEffect, useState } from "react";
import { Expand, ImageOff, X } from "lucide-react";
import { StreetView } from "@/components/map/StreetView";
import { cn } from "@/lib/utils";

type Mode = "photo" | "street";

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      className="flex gap-0.5 rounded-full p-0.5"
      style={{ background: "rgba(255,255,255,.92)", boxShadow: "0 1px 4px rgba(0,0,0,.14)" }}
    >
      {(["photo", "street"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn("rounded-full px-3 py-1.5 text-[12px] font-[600] transition-colors")}
          style={mode === m ? { background: "var(--w-text)", color: "#fff" } : { color: "var(--w-mid)" }}
        >
          {m === "photo" ? "Photo" : "Street View"}
        </button>
      ))}
    </div>
  );
}

/**
 * The board's visual. Photo leads, because that is what a client is buying —
 * Street View is context, not the product. No board has a photo yet, so the
 * empty state says so rather than pretending.
 */
export function BoardVisual({
  lat, lng, photoUrl,
}: {
  lat: number; lng: number; photoUrl?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("photo");
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const body = (
    <>
      {mode === "street" ? (
        <StreetView lat={lat} lng={lng} className="absolute inset-0" />
      ) : photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2" style={{ background: "var(--w-sunk)" }}>
          <ImageOff className="size-6" strokeWidth={1.6} style={{ color: "var(--w-faint)" }} />
          <p className="text-[13px]" style={{ color: "var(--w-soft-text)" }}>Photo coming soon</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden" style={{ background: "var(--w-sunk)" }}>
        {body}
        <div className="absolute left-3 top-3 z-10"><ModeSwitch mode={mode} onChange={setMode} /></div>
        <button
          onClick={() => setFull(true)}
          aria-label="Expand"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,.92)", color: "var(--w-mid)", boxShadow: "0 1px 4px rgba(0,0,0,.14)" }}
        >
          <Expand className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      {full && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "rgba(8,11,14,.92)" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <ModeSwitch mode={mode} onChange={setMode} />
            <button
              onClick={() => setFull(false)}
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full"
              style={{ background: "rgba(255,255,255,.92)", color: "var(--w-text)" }}
            >
              <X className="size-5" strokeWidth={2.2} />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">{body}</div>
        </div>
      )}
    </>
  );
}
