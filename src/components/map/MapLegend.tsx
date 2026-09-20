"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { label: "Available",   color: "var(--color-available)" },
  { label: "Booked",      color: "var(--color-booked)" },
  { label: "Maintenance", color: "var(--color-maintenance)" },
  { label: "Damaged",     color: "var(--color-damaged)" },
];

/** What the marker shapes encode. Collapsed by default — it is a reference,
 *  not a permanent fixture competing with the map. */
export function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto absolute right-6 top-6 z-10 w-[212px] overflow-hidden rounded-[var(--radius-panel)] material-regular specular-edge">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5">
          {STATUSES.map((s) => (
            <span key={s.label} className="size-2.5 rounded-full" style={{ background: s.color }} />
          ))}
          <span className="ml-1 text-footnote font-[590] text-ink-100">Legend</span>
        </span>
        <ChevronDown
          className={cn("size-4 text-ink-400 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="border-t border-white/[0.07] px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1.5">
            {STATUSES.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="text-footnote text-ink-200">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3.5 border-t border-white/[0.07] pt-3">
            <div className="flex items-end gap-2.5">
              {[
                { h: 11, l: "S" },
                { h: 14, l: "M" },
                { h: 17, l: "L" },
              ].map((p) => (
                <span key={p.l} className="flex flex-col items-center gap-1">
                  <span
                    className="rounded-full bg-ink-300"
                    style={{ width: p.h * 0.72, height: p.h * 0.72 }}
                  />
                  <span className="text-caption text-ink-500">{p.l}</span>
                </span>
              ))}
              <span className="ml-1 text-caption leading-tight text-ink-500">
                pin size =<br />board size
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5 border-t border-white/[0.07] pt-3">
            <span className="grid size-3.5 place-items-center rounded-full bg-ink-300">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
            <span className="text-caption text-ink-500">bright centre = backlit</span>
          </div>

          <p className="mt-3 border-t border-white/[0.07] pt-3 text-caption leading-snug text-ink-500">
            Zoomed out, each ring shows that city&rsquo;s status mix.
          </p>
        </div>
      )}
    </div>
  );
}
