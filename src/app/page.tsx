import Link from "next/link";
import { ArrowRight, MapPin, Search, Wrench, PhoneCall } from "lucide-react";
import { publicStats, liveBrandNames, PUBLIC_BOARDS, PUBLIC_CITIES } from "@/lib/publicBoards";
import { SiteFooter } from "@/components/site/SiteChrome";
import { SiteSidebar } from "@/components/site/SiteSidebar";
import { CoverageMap } from "@/components/site/CoverageMap";
import { ContactForm } from "@/components/site/ContactForm";
import { inr } from "@/lib/utils";

export const metadata = {
  title: "DV Outdoor — Billboard advertising across Gujarat",
  description:
    "Hoardings, unipoles and gantries across Saurashtra and Gujarat. See what's free on a live map, pick your sites, and book directly with the owner.",
};

const STEPS = [
  { icon: Search, title: "Find your sites", body: "Filter by city, budget, size and lighting on a live map. Every site is pinned where it actually stands." },
  { icon: PhoneCall, title: "Check availability", body: "Send an enquiry on any site. We confirm dates and pricing the same day — no broker in between." },
  { icon: Wrench, title: "We handle the rest", body: "Printing, mounting and upkeep. Our own crews inspect every board, so your campaign never sits torn." },
];

export default function LandingPage() {
  const stats = publicStats();
  const brands = liveBrandNames(7);
  const featured = PUBLIC_BOARDS.filter((b) => b.availability === "available")
    .sort((a, b) => b.askingRate - a.askingRate)
    .slice(0, 3);

  const counts = {
    total: PUBLIC_BOARDS.length,
    available: stats.available,
    booked: PUBLIC_BOARDS.length - stats.available,
    cities: stats.cities,
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <SiteSidebar counts={counts} />
      <main className="min-w-0 flex-1 overflow-y-auto">

      {/* ------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden">
        {/* Drop a real photo of one of your boards at public/hero.jpg and it
            takes over from the gradient automatically. */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(118deg, #0b0e10 0%, #101a26 40%, #12293d 70%, #14384f 100%), url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "multiply",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-transparent" />

        <div className="mx-auto max-w-[1180px] px-10 py-24 sm:py-28">
          <div className="max-w-[640px]">
            <h1 className="text-[clamp(2.4rem,5.5vw,3.9rem)] font-[680] leading-[1.06] tracking-[-0.035em] text-ink-0">
              Billboard advertising across Gujarat, made simple
            </h1>
            <p className="mt-6 max-w-[52ch] text-[clamp(1.02rem,1.6vw,1.2rem)] leading-relaxed text-ink-200">
              {stats.boards} hoardings in {stats.cities} cities, owned and maintained by us.
              See what&rsquo;s free on a live map, pick your sites, and deal directly with the
              owner — no broker, no markup.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/boards"
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-7 py-3.5 text-body font-[620] text-accent-on transition-colors hover:bg-accent-hover"
              >
                Browse {stats.available} available billboards
                <ArrowRight className="size-[18px]" strokeWidth={2.4} />
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-7 py-3.5 text-body font-[590] text-ink-100 ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/[0.08]"
              >
                <PhoneCall className="size-[17px]" strokeWidth={2.2} />
                Contact us directly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- trusted */}
      <section className="border-y border-white/[0.07] py-12">
        <div className="mx-auto max-w-[1180px] px-10">
          <p className="text-center text-subhead font-[590] text-ink-100">Trusted by leading brands</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {brands.map((b) => (
              <span key={b} className="text-title3 font-[680] tracking-[-0.02em] text-ink-500">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ stats */}
      <section className="py-16">
        <div className="mx-auto max-w-[1180px] px-10">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {[
              { n: stats.boards.toLocaleString("en-IN"), l: "Sites owned" },
              { n: stats.cities, l: "Cities covered" },
              { n: stats.liveBrands, l: "Brands running now" },
              { n: stats.available, l: "Free this month" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-[clamp(2rem,4vw,2.75rem)] font-[680] tabular-nums tracking-[-0.03em] text-accent">
                  {s.n}
                </dt>
                <dd className="mt-1 text-subhead text-ink-500">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------------- how */}
      <section id="how" className="scroll-mt-20 border-t border-white/[0.07] py-20">
        <div className="mx-auto max-w-[1180px] px-10">
          <h2 className="max-w-[18ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-[680] leading-[1.12] tracking-[-0.03em] text-ink-0">
            Three steps from map to live campaign
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title}>
                <span
                  className="grid size-12 place-items-center rounded-[var(--radius-card)]"
                  style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
                >
                  <Icon className="size-[22px] text-accent" strokeWidth={2} />
                </span>
                <p className="mt-5 text-caption2 uppercase text-accent">Step {i + 1}</p>
                <h3 className="mt-1.5 text-title3 font-[620] text-ink-0">{title}</h3>
                <p className="mt-2.5 text-subhead leading-relaxed text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- coverage */}
      <section id="coverage" className="scroll-mt-20 border-t border-white/[0.07] py-20">
        <div className="mx-auto max-w-[1180px] px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-[680] tracking-[-0.03em] text-ink-0">
                Where we are
              </h2>
              <p className="mt-2 max-w-[54ch] text-subhead text-ink-500">{PUBLIC_CITIES.join(" · ")}</p>
            </div>
            <Link href="/boards" className="inline-flex items-center gap-1.5 text-subhead font-[590] text-accent">
              Open the full map
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-[var(--radius-panel)] ring-1 ring-white/[0.08]">
            <CoverageMap />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- available */}
      <section className="border-t border-white/[0.07] py-20">
        <div className="mx-auto max-w-[1180px] px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-[680] tracking-[-0.03em] text-ink-0">
              Free right now
            </h2>
            <Link href="/boards" className="inline-flex items-center gap-1.5 text-subhead font-[590] text-accent">
              All {stats.available} sites
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {featured.map((b) => (
              <Link
                key={b.code}
                href={`/boards?board=${b.code}`}
                className="rounded-[var(--radius-card)] bg-chrome-raised p-6 ring-1 ring-white/[0.07] ring-inset transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-caption text-ink-500">{b.code}</span>
                  <span
                    className="rounded-[var(--radius-pill)] px-2.5 py-1 text-caption font-[620]"
                    style={{ color: "var(--color-available)", background: "color-mix(in srgb, var(--color-available) 15%, transparent)" }}
                  >
                    Available
                  </span>
                </div>
                <h3 className="mt-4 text-title3 font-[620] leading-snug text-ink-0">{b.name}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-footnote text-ink-400">
                  <MapPin className="size-3.5" strokeWidth={2} />
                  {b.area}, {b.city}
                </p>
                <p className="mt-5 flex items-baseline gap-2 border-t border-white/[0.07] pt-4">
                  <span className="text-body font-[620] tabular-nums text-ink-0">{inr(b.askingRate)}</span>
                  <span className="text-footnote text-ink-500">/ month</span>
                  <span className="ml-auto text-footnote tabular-nums text-ink-500">{b.widthFt}×{b.heightFt} ft</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- contact */}
      <section id="contact" className="scroll-mt-20 border-t border-white/[0.07] py-20">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-10 lg:grid-cols-[1fr_minmax(0,460px)]">
          <div>
            <h2 className="max-w-[16ch] text-[clamp(1.9rem,4vw,2.9rem)] font-[680] leading-[1.1] tracking-[-0.03em] text-ink-0">
              Tell us the city. We&rsquo;ll tell you what&rsquo;s free.
            </h2>
            <p className="mt-5 max-w-[46ch] text-body leading-relaxed text-ink-400">
              Not sure which sites you need? Send us the cities and dates you&rsquo;re
              thinking about and we&rsquo;ll put together options — with photos, footfall
              and pricing.
            </p>
            <Link
              href="/boards"
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-6 py-3 text-subhead font-[590] text-accent-on transition-colors hover:bg-accent-hover"
            >
              Browse billboards
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <ContactForm />
        </div>
      </section>

        <SiteFooter />
      </main>
    </div>
  );
}
