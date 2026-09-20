"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import type { PublicBoard } from "@/lib/publicBoards";
import { cn, inr, fullDate } from "@/lib/utils";
import { EnquiryForm } from "@/components/site/EnquiryForm";

type Avail = "all" | "available" | "booked";
type Size = "all" | "small" | "medium" | "large";
type Light = "all" | "backlit" | "frontlit";

function lightingLabel(l: PublicBoard["lighting"]) {
  return l === "backlit" ? "Back-lit" : l === "frontlit" ? "Front-lit" : "Non-lit";
}

function Chip({
  on, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "h-9 shrink-0 rounded-[var(--radius-pill)] px-4 text-footnote font-[520] ring-1 ring-inset transition-colors",
        on
          ? "bg-accent text-accent-on ring-transparent"
          : "bg-black/25 text-ink-200 ring-white/[0.1] hover:bg-white/[0.07]",
      )}
    >
      {children}
    </button>
  );
}

function BoardTile({ b, onOpen }: { b: PublicBoard; onOpen: () => void }) {
  const free = b.availability === "available";
  return (
    <button
      onClick={onOpen}
      className="flex flex-col rounded-[var(--radius-card)] bg-chrome-raised p-5 text-left ring-1 ring-white/[0.07] ring-inset transition-colors hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-caption text-ink-500">{b.code}</span>
        <span
          className="shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-caption font-[620]"
          style={{
            color: free ? "var(--color-available)" : "var(--color-booked)",
            background: `color-mix(in srgb, ${free ? "var(--color-available)" : "var(--color-booked)"} 15%, transparent)`,
          }}
        >
          {free ? "Available" : "Booked"}
        </span>
      </div>

      <h3 className="mt-3.5 text-title3 font-[620] leading-tight text-ink-0">{b.name}</h3>
      <p className="mt-1.5 flex items-start gap-1.5 text-footnote text-ink-400">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-600" strokeWidth={2} />
        {b.area}, {b.city}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-footnote text-ink-500">
        <span className="capitalize">{b.sizeCategory}</span>
        <span className="tabular-nums">{b.widthFt}×{b.heightFt} ft</span>
        <span>{lightingLabel(b.lighting)}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2 border-t border-white/[0.07] pt-4">
        <span className="text-body font-[620] tabular-nums text-ink-0">{inr(b.askingRate)}</span>
        <span className="text-footnote text-ink-500">/ month</span>
        {!free && b.freeFrom && (
          <span className="ml-auto text-caption tabular-nums text-ink-500">
            free {fullDate(b.freeFrom)}
          </span>
        )}
      </div>
    </button>
  );
}

export function InventoryBrowser({
  boards, cities, initialBoard, initialCity,
}: {
  boards: PublicBoard[];
  cities: string[];
  initialBoard: string | null;
  initialCity: string | null;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(initialCity);
  const [avail, setAvail] = useState<Avail>("all");
  const [size, setSize] = useState<Size>("all");
  const [light, setLight] = useState<Light>("all");
  const [maxRate, setMaxRate] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(initialBoard);
  const [shown, setShown] = useState(24);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boards.filter((b) => {
      if (city && b.city !== city) return false;
      if (avail !== "all" && b.availability !== avail) return false;
      if (size !== "all" && b.sizeCategory !== size) return false;
      if (light !== "all" && b.lighting !== light) return false;
      if (maxRate && b.askingRate > maxRate) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.area.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.pincode.includes(q) ||
        b.code.toLowerCase().includes(q)
      );
    });
  }, [boards, query, city, avail, size, light, maxRate]);

  // Reset pagination when the filters change. Adjusting state during render
  // off a changed signature is React's documented pattern for this — an effect
  // would render the stale page count first, then immediately re-render.
  const filterSig = `${query}|${city}|${avail}|${size}|${light}|${maxRate}`;
  const [prevSig, setPrevSig] = useState(filterSig);
  if (filterSig !== prevSig) {
    setPrevSig(filterSig);
    setShown(24);
  }

  const board = open ? boards.find((b) => b.code === open) ?? null : null;
  const active = [city, avail !== "all" ? avail : null, size !== "all" ? size : null,
                  light !== "all" ? light : null, maxRate ? "price" : null].filter(Boolean).length;

  return (
    <main className="flex-1 px-6 pb-20 pt-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-[680] tracking-[-0.03em] text-ink-0">
          Our inventory
        </h1>
        <p className="mt-2 text-body text-ink-400">
          {boards.length} sites across {cities.length} cities. Prices are per month, before
          printing and mounting.
        </p>

        {/* search */}
        <div className="relative mt-7">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={1.9} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Road, area, city or pincode"
            className={cn(
              "h-12 w-full rounded-[var(--radius-control)] bg-black/30 pl-11",
              query ? "pr-11" : "pr-4",
              "text-body text-ink-0 placeholder:text-ink-600",
              "ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent",
            )}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-ink-300 hover:text-ink-0"
            >
              <X className="size-4" strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip on={avail === "available"} onClick={() => setAvail(avail === "available" ? "all" : "available")}>
            Available now
          </Chip>
          <Chip on={light === "backlit"} onClick={() => setLight(light === "backlit" ? "all" : "backlit")}>
            Back-lit
          </Chip>
          <Chip on={size === "large"} onClick={() => setSize(size === "large" ? "all" : "large")}>
            Large format
          </Chip>
          <Chip on={maxRate === 50000} onClick={() => setMaxRate(maxRate === 50000 ? null : 50000)}>
            Under ₹50,000
          </Chip>

          <span className="mx-1 h-6 w-px bg-white/[0.1]" />

          <div className="flex gap-2 overflow-x-auto">
            {cities.map((c) => (
              <Chip key={c} on={city === c} onClick={() => setCity(city === c ? null : c)}>
                {c}
              </Chip>
            ))}
          </div>

          {active > 0 && (
            <button
              onClick={() => { setCity(null); setAvail("all"); setSize("all"); setLight("all"); setMaxRate(null); }}
              className="ml-auto inline-flex items-center gap-1.5 text-footnote text-ink-500 transition-colors hover:text-ink-200"
            >
              <SlidersHorizontal className="size-3.5" strokeWidth={2} />
              Clear {active} filter{active > 1 ? "s" : ""}
            </button>
          )}
        </div>

        <p className="mt-6 text-footnote tabular-nums text-ink-500">
          {results.length.toLocaleString("en-IN")} site{results.length === 1 ? "" : "s"}
        </p>

        {results.length === 0 ? (
          <p className="mt-16 text-center text-body text-ink-500">
            Nothing matches that. Try a wider area or clear a filter.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, shown).map((b) => (
                <BoardTile key={b.code} b={b} onOpen={() => setOpen(b.code)} />
              ))}
            </div>
            {results.length > shown && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setShown((n) => n + 24)}
                  className="rounded-[var(--radius-pill)] px-7 py-3 text-subhead font-[590] text-ink-200 ring-1 ring-white/[0.12] ring-inset transition-colors hover:bg-white/[0.06]"
                >
                  Show more ({results.length - shown} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* detail + enquiry */}
      <AnimatePresence>
        {board && (
          <>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              aria-label="Close"
              onClick={() => setOpen(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.aside
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[460px] overflow-y-auto border-l border-white/[0.08] material-thick"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-7 pb-6 pt-7">
                <div className="min-w-0">
                  <span className="font-mono text-caption text-ink-500">{board.code}</span>
                  <h2 className="mt-1 text-title2 font-[680] leading-tight text-ink-0">{board.name}</h2>
                  <p className="mt-2 text-subhead text-ink-300">{board.address}</p>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-black/30 text-ink-400 hover:text-ink-0"
                >
                  <X className="size-4" strokeWidth={2.2} />
                </button>
              </div>

              <div className="border-b border-white/[0.07] px-7 py-6">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-footnote text-ink-500">Rate</p>
                    <p className="mt-1 text-title3 font-[680] tabular-nums text-ink-0">
                      {inr(board.askingRate)}
                      <span className="ml-1 text-footnote font-normal text-ink-500">/mo</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-footnote text-ink-500">Availability</p>
                    <p
                      className="mt-1 text-title3 font-[680]"
                      style={{ color: board.availability === "available" ? "var(--color-available)" : "var(--color-booked)" }}
                    >
                      {board.availability === "available" ? "Free now" : "Booked"}
                    </p>
                    {board.freeFrom && (
                      <p className="text-caption tabular-nums text-ink-500">
                        opens {fullDate(board.freeFrom)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-footnote text-ink-500">Size</p>
                    <p className="mt-1 text-subhead font-[590] tabular-nums text-ink-100">
                      {board.widthFt}×{board.heightFt} ft
                      <span className="ml-1.5 text-footnote font-normal capitalize text-ink-500">
                        {board.sizeCategory}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-footnote text-ink-500">Lighting</p>
                    <p className="mt-1 text-subhead font-[590] text-ink-100">{lightingLabel(board.lighting)}</p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${board.lat},${board.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-footnote font-[590] text-accent transition-opacity hover:opacity-80"
                >
                  <MapPin className="size-3.5" strokeWidth={2.2} />
                  See it on Google Maps
                </a>
              </div>

              <div className="px-7 py-6">
                <h3 className="text-title3 font-[620] text-ink-0">Check availability</h3>
                <p className="mt-1.5 text-footnote text-ink-400">
                  Send your details and we&rsquo;ll confirm dates and pricing.
                </p>
                <div className="mt-5">
                  <EnquiryForm board={board} onDone={() => setOpen(null)} />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
