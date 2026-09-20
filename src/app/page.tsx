import Link from "next/link";
import { ArrowRight, MapPin, Search, Wrench, PhoneCall } from "lucide-react";
import { publicStats, liveBrandNames, PUBLIC_BOARDS, PUBLIC_CITIES } from "@/lib/publicBoards";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
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

  return (
    <div className="site min-h-dvh">
      <SiteHeader />

      {/* ------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden">
        {/* Drop a real photo of one of your boards at public/hero.jpg and it
            replaces this gradient automatically. */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(115deg, #0b1d33 0%, #133a5e 42%, #1d5c86 72%, #2b7ea8 100%), url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "multiply",
          }}
        />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(90deg, rgba(6,14,24,0.86) 0%, rgba(6,14,24,0.55) 55%, rgba(6,14,24,0.25) 100%)" }}
        />

        <div className="mx-auto max-w-[1180px] px-6 py-24 sm:py-32">
          <div className="max-w-[640px]">
            <h1 className="text-[clamp(2.4rem,5.5vw,3.9rem)] font-[700] leading-[1.06] tracking-[-0.035em] text-white">
              Billboard advertising across Gujarat, made simple
            </h1>
            <p className="mt-6 max-w-[52ch] text-[clamp(1.02rem,1.6vw,1.2rem)] leading-relaxed text-white/85">
              {stats.boards} hoardings in {stats.cities} cities, owned and maintained by us.
              See what&rsquo;s free on a live map, pick your sites, and deal directly with the
              owner — no broker, no markup.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/boards"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[16px] font-[600] transition-transform hover:scale-[1.02]"
                style={{ color: "var(--s-text)" }}
              >
                Browse {stats.available} available billboards
                <ArrowRight className="size-[18px]" strokeWidth={2.4} />
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[16px] font-[600] text-white ring-1 ring-inset ring-white/35 transition-colors hover:bg-white/10"
              >
                <PhoneCall className="size-[17px]" strokeWidth={2.2} />
                Contact us directly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- trusted */}
      <section className="border-b py-12" style={{ borderColor: "var(--s-line)", background: "var(--s-bg)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <p className="text-center text-[15px] font-[600]" style={{ color: "var(--s-text)" }}>
            Trusted by leading brands
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {brands.map((b) => (
              <span
                key={b}
                className="text-[19px] font-[700] tracking-[-0.02em]"
                style={{ color: "var(--s-text-soft)", opacity: 0.8 }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ stats */}
      <section className="py-16" style={{ background: "var(--s-bg)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {[
              { n: stats.boards.toLocaleString("en-IN"), l: "Sites owned" },
              { n: stats.cities, l: "Cities covered" },
              { n: stats.liveBrands, l: "Brands running now" },
              { n: stats.available, l: "Free this month" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-[clamp(2rem,4vw,2.75rem)] font-[700] tabular-nums tracking-[-0.03em]" style={{ color: "var(--s-accent)" }}>
                  {s.n}
                </dt>
                <dd className="mt-1 text-[15px]" style={{ color: "var(--s-text-soft)" }}>{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------------- how */}
      <section id="how" className="scroll-mt-20 py-20" style={{ background: "var(--s-bg-soft)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <h2 className="max-w-[18ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-[700] leading-[1.12] tracking-[-0.03em]" style={{ color: "var(--s-text)" }}>
            Three steps from map to live campaign
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title}>
                <span
                  className="grid size-12 place-items-center rounded-[14px]"
                  style={{ background: "var(--s-accent-soft)" }}
                >
                  <Icon className="size-[22px]" strokeWidth={2} style={{ color: "var(--s-accent)" }} />
                </span>
                <p className="mt-5 text-[13px] font-[700]" style={{ color: "var(--s-accent)" }}>
                  STEP {i + 1}
                </p>
                <h3 className="mt-1.5 text-[20px] font-[650] tracking-[-0.02em]" style={{ color: "var(--s-text)" }}>
                  {title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: "var(--s-text-soft)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- coverage */}
      <section id="coverage" className="scroll-mt-20 py-20" style={{ background: "var(--s-bg)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-[700] tracking-[-0.03em]" style={{ color: "var(--s-text)" }}>
                Where we are
              </h2>
              <p className="mt-2 max-w-[54ch] text-[15px]" style={{ color: "var(--s-text-soft)" }}>
                {PUBLIC_CITIES.join(" · ")}
              </p>
            </div>
            <Link
              href="/boards"
              className="inline-flex items-center gap-1.5 text-[15px] font-[600]"
              style={{ color: "var(--s-accent)" }}
            >
              Open the full map
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-[18px] border" style={{ borderColor: "var(--s-line)" }}>
            <CoverageMap />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- available */}
      <section className="py-20" style={{ background: "var(--s-bg-soft)" }}>
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-[700] tracking-[-0.03em]" style={{ color: "var(--s-text)" }}>
              Free right now
            </h2>
            <Link href="/boards" className="inline-flex items-center gap-1.5 text-[15px] font-[600]" style={{ color: "var(--s-accent)" }}>
              All {stats.available} sites
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {featured.map((b) => (
              <Link
                key={b.code}
                href={`/boards?board=${b.code}`}
                className="rounded-[16px] border p-6 transition-shadow hover:shadow-[0_8px_28px_-12px_rgba(16,24,32,0.18)]"
                style={{ borderColor: "var(--s-line)", background: "var(--s-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px]" style={{ color: "var(--s-text-soft)" }}>{b.code}</span>
                  <span
                    className="rounded-full px-2.5 py-1 text-[12px] font-[650]"
                    style={{ color: "var(--s-good)", background: "color-mix(in srgb, var(--s-good) 10%, transparent)" }}
                  >
                    Available
                  </span>
                </div>
                <h3 className="mt-4 text-[19px] font-[650] leading-snug tracking-[-0.02em]" style={{ color: "var(--s-text)" }}>
                  {b.name}
                </h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-[14px]" style={{ color: "var(--s-text-soft)" }}>
                  <MapPin className="size-3.5" strokeWidth={2} />
                  {b.area}, {b.city}
                </p>
                <p className="mt-5 flex items-baseline gap-2 border-t pt-4" style={{ borderColor: "var(--s-line-soft)" }}>
                  <span className="text-[19px] font-[700] tabular-nums" style={{ color: "var(--s-text)" }}>{inr(b.askingRate)}</span>
                  <span className="text-[14px]" style={{ color: "var(--s-text-soft)" }}>/ month</span>
                  <span className="ml-auto text-[13px] tabular-nums" style={{ color: "var(--s-text-soft)" }}>
                    {b.widthFt}×{b.heightFt} ft
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- contact */}
      <section id="contact" className="scroll-mt-20 py-20" style={{ background: "var(--s-bg)" }}>
        <div className="mx-auto grid max-w-[1180px] gap-12 px-6 lg:grid-cols-[1fr_minmax(0,460px)]">
          <div>
            <h2 className="max-w-[16ch] text-[clamp(1.9rem,4vw,2.9rem)] font-[700] leading-[1.1] tracking-[-0.03em]" style={{ color: "var(--s-text)" }}>
              Tell us the city. We&rsquo;ll tell you what&rsquo;s free.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed" style={{ color: "var(--s-text-soft)" }}>
              Not sure which sites you need? Send us the cities and dates you&rsquo;re
              thinking about and we&rsquo;ll put together options — with photos, footfall
              and pricing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/boards"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-[600] text-white"
                style={{ background: "var(--s-accent)" }}
              >
                Browse billboards
                <ArrowRight className="size-4" strokeWidth={2.4} />
              </Link>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
