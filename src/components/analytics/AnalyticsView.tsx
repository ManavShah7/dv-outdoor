"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpDown, Search, X } from "lucide-react";
import {
  COMPANY_PROFILES, CATEGORY_PROFILES, portfolioTotals,
  type CompanyProfile, type CategoryProfile,
} from "@/lib/analytics";
import { CATEGORIES } from "@/lib/companies";
import type { Board } from "@/lib/types";
import { cn, inr, fullDate } from "@/lib/utils";
import { MonthBars, RankedBars, Stat, money } from "@/components/analytics/Charts";

type Tab = "clients" | "categories";
type SortKey = "company" | "category" | "currentBoards" | "totalBookings"
  | "distinctBoards" | "peakConcurrentBoards" | "avgDurationMonths"
  | "avgMonthlyRate" | "lifetimeValue";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "company",              label: "Client",   numeric: false },
  { key: "category",             label: "Category", numeric: false },
  { key: "currentBoards",        label: "Now",      numeric: true },
  { key: "totalBookings",        label: "Bookings", numeric: true },
  { key: "distinctBoards",       label: "Boards",   numeric: true },
  { key: "peakConcurrentBoards", label: "Peak",     numeric: true },
  { key: "avgDurationMonths",    label: "Lease",    numeric: true },
  { key: "avgMonthlyRate",       label: "Rate",     numeric: true },
  { key: "lifetimeValue",        label: "Lifetime", numeric: true },
];

/* --------------------------------------------------------------- detail */
function CompanyDetail({ p, onBack }: { p: CompanyProfile; onBack: () => void }) {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto material-thick">
      <div className="flex items-start gap-2 border-b border-white/[0.07] px-8 pb-6 pt-8">
        <button
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 mt-1 grid size-7 shrink-0 place-items-center rounded-full text-ink-400 hover:text-ink-0"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.1} />
        </button>
        <div className="min-w-0">
          <h1 className="text-title2 font-[680] text-ink-0">{p.company}</h1>
          {p.category && <p className="mt-1 text-subhead text-ink-400">{p.category}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-7 px-8 py-7">
        <section>
          <h2 className="text-caption2 uppercase text-ink-500">Volume</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Total bookings" value={String(p.totalBookings)} />
            <Stat label="Boards now" value={String(p.currentBoards)} />
            <Stat label="Distinct boards" value={String(p.distinctBoards)} />
            <Stat label="Peak at once" value={String(p.peakConcurrentBoards)} />
          </div>
        </section>

        <section>
          <h2 className="text-caption2 uppercase text-ink-500">Money</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Lifetime value" value={money(p.lifetimeValue)} />
            <Stat label="Current monthly" value={money(p.currentMonthlyValue)} />
            <Stat label="Avg rate / month" value={inr(p.avgMonthlyRate)} />
            <Stat label="Avg discount" value={`${p.avgDiscountPct}%`} />
          </div>
        </section>

        <section>
          <h2 className="text-caption2 uppercase text-ink-500">When they book</h2>
          <div className="mt-3 rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
            <MonthBars values={p.monthlyBookings} height={84} />
            <p className="mt-3 text-caption text-ink-500">
              Bookings started per calendar month, all years combined.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-caption2 uppercase text-ink-500">Year on year</h2>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] bg-chrome-raised ring-1 ring-white/[0.07] ring-inset">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="px-4 py-2.5 text-left text-caption2 uppercase text-ink-500">Year</th>
                  <th className="px-4 py-2.5 text-right text-caption2 uppercase text-ink-500">Bookings</th>
                  <th className="px-4 py-2.5 text-right text-caption2 uppercase text-ink-500">Value</th>
                </tr>
              </thead>
              <tbody>
                {p.byYear.map((y) => (
                  <tr key={y.year} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-2.5 text-footnote tabular-nums text-ink-200">{y.year}</td>
                    <td className="px-4 py-2.5 text-right text-footnote tabular-nums text-ink-300">{y.bookings}</td>
                    <td className="px-4 py-2.5 text-right text-footnote tabular-nums text-ink-100">{money(y.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-caption2 uppercase text-ink-500">Where they buy</h2>
          <div className="mt-3 flex flex-col gap-4 rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
            <div>
              <p className="mb-2.5 text-footnote text-ink-400">Cities</p>
              <RankedBars items={p.topCities} />
            </div>
            <div className="border-t border-white/[0.07] pt-4">
              <p className="mb-2.5 text-footnote text-ink-400">Areas</p>
              <RankedBars items={p.topAreas} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-caption2 uppercase text-ink-500">What they take</h2>
          <div className="mt-3 flex flex-col gap-4 rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
            <div>
              <p className="mb-2.5 text-footnote text-ink-400">Size</p>
              <RankedBars items={p.sizeMix} />
            </div>
            <div className="border-t border-white/[0.07] pt-4">
              <p className="mb-2.5 text-footnote text-ink-400">Lighting</p>
              <RankedBars items={p.lightingMix} />
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-white/[0.07] pt-4">
              <div>
                <p className="text-footnote text-ink-400">Avg lease</p>
                <p className="mt-0.5 text-body font-[590] tabular-nums text-ink-0">
                  {p.avgDurationMonths} months
                </p>
              </div>
              <div>
                <p className="text-footnote text-ink-400">Banner printed by us</p>
                <p className="mt-0.5 text-body font-[590] tabular-nums text-ink-0">
                  {p.printedByUs} / {p.printedByUs + p.printedByClient}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-4">
          <h2 className="text-caption2 uppercase text-ink-500">History</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="First booking" value={p.firstBooking ? fullDate(p.firstBooking) : "—"} />
            <Stat label="Latest booking" value={p.lastBooking ? fullDate(p.lastBooking) : "—"} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ category */
function CategoryCard({ c }: { c: CategoryProfile }) {
  return (
    <article className="flex flex-col rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-subhead font-[620] text-ink-0">{c.category}</h3>
        <span className="shrink-0 text-caption tabular-nums text-ink-500">{c.companies} clients</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-caption2 uppercase text-ink-600">Bookings</p>
          <p className="mt-0.5 text-body font-[620] tabular-nums text-ink-0">{c.totalBookings}</p>
        </div>
        <div>
          <p className="text-caption2 uppercase text-ink-600">Boards now</p>
          <p className="mt-0.5 text-body font-[620] tabular-nums text-ink-0">{c.currentBoards}</p>
        </div>
        <div>
          <p className="text-caption2 uppercase text-ink-600">Lifetime</p>
          <p className="mt-0.5 text-body font-[620] tabular-nums text-ink-0">{money(c.lifetimeValue)}</p>
        </div>
      </div>

      <div className="mt-5">
        <MonthBars values={c.monthlyBookings} height={56} />
      </div>

      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <p className="mb-2.5 text-caption2 uppercase text-ink-600">Top areas</p>
        <RankedBars items={c.topAreas.slice(0, 3)} />
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- view */
export function AnalyticsView({ boards }: { boards: Board[] }) {
  const [tab, setTab] = useState<Tab>("clients");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [openCompany, setOpenCompany] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("lifetimeValue");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  function toggleSort(k: SortKey) {
    if (k === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir(k === "company" || k === "category" ? "asc" : "desc"); }
  }

  const totals = useMemo(() => portfolioTotals(boards), [boards]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = COMPANY_PROFILES.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.company.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false)
      );
    });
    const sign = dir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      const av = a[sort], bv = b[sort];
      if (typeof av === "string" || typeof bv === "string") {
        return sign * String(av ?? "").localeCompare(String(bv ?? ""));
      }
      return sign * (Number(av ?? 0) - Number(bv ?? 0));
    });
  }, [query, category, sort, dir]);

  const open = openCompany
    ? COMPANY_PROFILES.find((p) => p.company === openCompany) ?? null
    : null;

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto material-thick">
        <div className="mx-auto max-w-[1400px] px-10 py-9">
          {/* portfolio strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <Stat label="Clients" value={String(totals.clients)} />
            <Stat label="Categories" value={String(totals.categories)} />
            <Stat label="Bookings ever" value={String(totals.totalBookings)} />
            <Stat label="Lifetime value" value={money(totals.lifetimeValue)} />
            <Stat label="Live monthly" value={money(totals.currentMonthly)} />
          </div>

          {/* tabs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center gap-1 rounded-[var(--radius-control)] bg-black/30 p-1 ring-1 ring-white/[0.08] ring-inset">
              {(["clients", "categories"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "h-[34px] rounded-[7px] px-4 text-footnote font-[590] capitalize transition-colors",
                    tab === t ? "bg-white/[0.12] text-ink-0" : "text-ink-400 hover:text-ink-100",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "clients" && (
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-500" strokeWidth={1.9} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Client or category"
                  className={cn(
                    "h-11 w-full rounded-[var(--radius-control)] bg-black/30 pl-11",
                    query ? "pr-11" : "pr-4",
                    "text-subhead text-ink-0 placeholder:text-ink-500",
                    "ring-1 ring-white/[0.08] ring-inset outline-none focus:ring-2 focus:ring-accent",
                  )}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-ink-300 hover:text-ink-0"
                  >
                    <X className="size-3.5" strokeWidth={2.4} />
                  </button>
                )}
              </div>
            )}
          </div>

          {tab === "clients" ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(on ? null : c)}
                      className={cn(
                        "h-9 rounded-[var(--radius-control)] px-4 text-footnote font-[520] ring-1 ring-inset transition-colors",
                        on
                          ? "bg-accent text-accent-on ring-transparent"
                          : "bg-black/25 text-ink-200 ring-white/[0.08] hover:bg-white/[0.07]",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] ring-1 ring-white/[0.07] ring-inset">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {COLUMNS.map((c) => {
                        const active = sort === c.key;
                        return (
                          <th
                            key={c.key}
                            className={cn(
                              "sticky top-0 whitespace-nowrap bg-chrome px-4 py-3",
                              c.numeric ? "text-right" : "text-left",
                            )}
                          >
                            <button
                              onClick={() => toggleSort(c.key)}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-caption2 uppercase transition-colors",
                                active ? "text-ink-100" : "text-ink-500 hover:text-ink-200",
                              )}
                            >
                              {c.label}
                              <ArrowUpDown
                                className={cn("size-3", active ? "opacity-100" : "opacity-35")}
                                strokeWidth={2.2}
                              />
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr
                        key={p.company}
                        onClick={() => setOpenCompany(p.company)}
                        className="cursor-pointer transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="border-b border-white/[0.05] px-4 py-3 text-subhead font-[590] text-ink-0">{p.company}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-footnote text-ink-400">{p.category ?? "—"}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-200">{p.currentBoards}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-300">{p.totalBookings}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-300">{p.distinctBoards}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-300">{p.peakConcurrentBoards}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-300">{p.avgDurationMonths}m</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-300">{inr(p.avgMonthlyRate)}</td>
                        <td className="border-b border-white/[0.05] px-4 py-3 text-right text-footnote tabular-nums text-ink-100">{money(p.lifetimeValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <p className="mt-10 text-center text-subhead text-ink-500">Nothing matches that.</p>
              )}
            </>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {CATEGORY_PROFILES.map((c) => (
                <CategoryCard key={c.category} c={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      {open && (
        <>
          <button
            aria-label="Close client"
            onClick={() => setOpenCompany(null)}
            className="absolute inset-0 z-20 bg-black/45"
          />
          <motion.div
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-y-0 right-0 z-30 w-[480px] border-l border-white/[0.08] shadow-[var(--shadow-pop)]"
          >
            <CompanyDetail p={open} onBack={() => setOpenCompany(null)} />
          </motion.div>
        </>
      )}
    </div>
  );
}
