import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Wrench, Zap } from "lucide-react";
import { publicStats, liveBrandNames, PUBLIC_BOARDS, PUBLIC_CITIES } from "@/lib/publicBoards";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { CoverageMap } from "@/components/site/CoverageMap";
import { inr } from "@/lib/utils";

export const metadata = {
  title: "DV Outdoor — Hoardings across Saurashtra & Gujarat",
  description:
    "Browse 650 hoardings, unipoles and gantries across Gujarat on a live map. See what's free, check availability, and book it.",
};

const PROMISES = [
  {
    icon: MapPin,
    title: "Pin-accurate locations",
    body: "Every site is mapped to its exact coordinates, not a road name. See the junction, the approach and the traffic before you commit.",
  },
  {
    icon: Zap,
    title: "Live availability",
    body: "What you see is what's actually free. Booked sites show the date they open up, so you can plan a campaign months ahead.",
  },
  {
    icon: Wrench,
    title: "Maintained by us",
    body: "Our own crews inspect and repair every board. Damage is logged, triaged and fixed — your campaign doesn't sit torn for a week.",
  },
  {
    icon: ShieldCheck,
    title: "One owner, one invoice",
    body: "These are our boards. No broker markup, no chasing three vendors to put up one campaign.",
  },
];

export default function LandingPage() {
  const stats = publicStats();
  const brands = liveBrandNames(10);
  const featured = PUBLIC_BOARDS.filter((b) => b.availability === "available")
    .sort((a, b) => b.askingRate - a.askingRate)
    .slice(0, 3);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-caption2 uppercase text-accent">
            Outdoor advertising · Saurashtra, Gujarat
          </p>
          <h1 className="mt-5 max-w-[16ch] text-[clamp(2.5rem,7vw,4.5rem)] font-[680] leading-[1.03] tracking-[-0.035em] text-ink-0">
            {stats.boards} hoardings. One map.
          </h1>
          <p className="mt-6 max-w-[54ch] text-[clamp(1.05rem,2vw,1.35rem)] leading-relaxed text-ink-300">
            Stop reading a 600-slide PDF. See every site we own across {stats.cities} cities,
            what&rsquo;s free right now, and exactly where it stands — then check availability
            in a click.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/boards"
              className="inline-flex h-13 items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-7 py-3.5 text-body font-[620] text-accent-on transition-colors hover:bg-accent-hover"
            >
              Browse {stats.available} available sites
              <ArrowRight className="size-[18px]" strokeWidth={2.4} />
            </Link>
            <Link
              href="/boards"
              className="inline-flex items-center rounded-[var(--radius-pill)] px-6 py-3.5 text-body font-[590] text-ink-200 ring-1 ring-white/[0.12] ring-inset transition-colors hover:bg-white/[0.06]"
            >
              See the map
            </Link>
          </div>

          {/* credibility strip */}
          <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/[0.07] pt-10 sm:grid-cols-4">
            {[
              { n: stats.boards.toLocaleString("en-IN"), l: "Sites owned" },
              { n: stats.cities, l: "Cities covered" },
              { n: stats.liveBrands, l: "Brands running now" },
              { n: stats.available, l: "Free this month" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-display font-[680] tabular-nums text-ink-0">{s.n}</dt>
                <dd className="mt-1 text-footnote text-ink-500">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------- coverage */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="overflow-hidden rounded-[var(--radius-panel)] ring-1 ring-white/[0.08]">
            <CoverageMap />
          </div>
          <p className="mt-4 text-footnote text-ink-500">
            Every site, plotted where it actually stands. {PUBLIC_CITIES.slice(0, 6).join(" · ")}
            {PUBLIC_CITIES.length > 6 && ` · +${PUBLIC_CITIES.length - 6} more`}
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- brands */}
      <section className="border-y border-white/[0.07] px-6 py-14">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-caption2 uppercase text-ink-500">Currently advertising with us</p>
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-5">
            {brands.map((b) => (
              <span key={b} className="text-title3 font-[620] tracking-[-0.02em] text-ink-400">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- promises */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)] font-[680] leading-[1.1] tracking-[-0.03em] text-ink-0">
            Why brands book directly with us
          </h2>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {PROMISES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span
                  className="grid size-11 place-items-center rounded-[var(--radius-card)]"
                  style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
                >
                  <Icon className="size-5 text-accent" strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-title3 font-[620] text-ink-0">{title}</h3>
                <p className="mt-2.5 max-w-[46ch] text-body leading-relaxed text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- featured */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-[680] tracking-[-0.03em] text-ink-0">
              Free right now
            </h2>
            <Link
              href="/boards"
              className="inline-flex items-center gap-1.5 text-subhead font-[590] text-accent transition-opacity hover:opacity-80"
            >
              All {stats.available} available sites
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {featured.map((b) => (
              <Link
                key={b.code}
                href={`/boards?board=${b.code}`}
                className="group rounded-[var(--radius-card)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-caption text-ink-500">{b.code}</span>
                  <span
                    className="rounded-[var(--radius-pill)] px-2.5 py-1 text-caption font-[620]"
                    style={{
                      color: "var(--color-available)",
                      background: "color-mix(in srgb, var(--color-available) 15%, transparent)",
                    }}
                  >
                    Available
                  </span>
                </div>
                <h3 className="mt-4 text-title3 font-[620] leading-tight text-ink-0">{b.name}</h3>
                <p className="mt-1.5 text-footnote text-ink-400">
                  {b.area}, {b.city}
                </p>
                <p className="mt-4 flex items-baseline gap-2 border-t border-white/[0.07] pt-4">
                  <span className="text-body font-[620] tabular-nums text-ink-0">
                    {inr(b.askingRate)}
                  </span>
                  <span className="text-footnote text-ink-500">/ month</span>
                  <span className="ml-auto text-footnote tabular-nums text-ink-500">
                    {b.widthFt}×{b.heightFt} ft
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-[1200px] rounded-[var(--radius-panel)] px-8 py-16 text-center ring-1 ring-white/[0.08] sm:px-16"
             style={{ background: "color-mix(in srgb, var(--accent) 9%, transparent)" }}>
          <h2 className="mx-auto max-w-[18ch] text-[clamp(1.75rem,4vw,2.75rem)] font-[680] leading-[1.1] tracking-[-0.03em] text-ink-0">
            Tell us the city. We&rsquo;ll tell you what&rsquo;s free.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-body leading-relaxed text-ink-300">
            Pick a site, choose your dates, and send an enquiry. Someone from our office
            calls you back the same day.
          </p>
          <Link
            href="/boards"
            className="mt-9 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-7 py-3.5 text-body font-[620] text-accent-on transition-colors hover:bg-accent-hover"
          >
            Check availability
            <ArrowRight className="size-[18px]" strokeWidth={2.4} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
