"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Temporary: lets the palette be judged on the real screen instead of from a
 *  swatch sheet. Delete once the accent is chosen. */
const ACCENTS = [
  { id: "graphite", label: "Graphite", swatch: "#0a84ff" },
  { id: "teal",     label: "Teal",     swatch: "#17a8a4" },
  { id: "ember",    label: "Ember",    swatch: "#ff8a3d" },
] as const;

export function AccentSwitcher() {
  const [accent, setAccent] = useState<string>("graphite");

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return (
    <div className="absolute bottom-6 left-6 z-10 flex items-center gap-1 rounded-[var(--radius-pill)] material-thick specular-edge p-1.5">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => setAccent(a.id)}
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-footnote font-[590] transition-colors",
            accent === a.id ? "bg-white/12 text-ink-0" : "text-ink-400 hover:text-ink-100",
          )}
        >
          <span className="size-3 rounded-full ring-1 ring-white/25" style={{ background: a.swatch }} />
          {a.label}
        </button>
      ))}
    </div>
  );
}
