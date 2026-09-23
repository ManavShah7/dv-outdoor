import Link from "next/link";
import { publicStats, liveBrandNames, PUBLIC_CITIES } from "@/lib/publicBoards";
import { DECK_BOARDS, titleCase } from "@/lib/junagadhBoards";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";

export const metadata = {
  title: "DV Outdoor — Billboard advertising across Gujarat",
  description:
    "Hoardings, unipoles and gantries across Saurashtra and Gujarat. See what's free, pick your sites, book directly with the owner.",
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function LandingPage() {
  const stats = publicStats();
  const brands = liveBrandNames(6);
  const hero = DECK_BOARDS[0];
  const featured = DECK_BOARDS.slice(1, 4);
  const strip = DECK_BOARDS.slice(4, 10);

  return (
    <div className="site">
      <SiteHeader />

      {/* ----------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden">
        {hero?.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.photo} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
        )}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.34) 45%, rgba(0,0,0,.66) 100%)" }}
        />

        <div className="grid-w flex min-h-[86vh] flex-col justify-end pb-[120px] pt-[200px]">
          <Reveal amplitude={40}>
            <h1 className="t-hero" style={{ color: "#fff" }}>
              Gujarat, on
              <br />
              every corner.
            </h1>
            <p className="t-intro mt-6 max-w-[34ch]" style={{ color: "var(--sk-glyph-alpha)" }}>
              {stats.boards} hoardings across {stats.cities} cities — ours, maintained by us,
              rented directly to you.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/boards" className="btn">See what&rsquo;s free</Link>
              <Link href="#contact" className="btn btn-over">Talk to us</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- trusted */}
      <section className="sec" style={{ background: "var(--sk-fill)" }}>
        <div className="grid-w">
          <Reveal>
            <p className="t-small text-center" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
              Trusted by leading brands
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-14 gap-y-7">
              {brands.map((b) => (
                <span key={b} className="t-title" style={{ color: "var(--sk-fill-gray-tertiary)" }}>
                  {b}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- stats */}
      <section className="sec pt-0">
        <div className="grid-w">
          <Reveal as="section">
            <h2 className="t-headline max-w-[15ch]">Scale you can actually see.</h2>
          </Reveal>
          <dl className="mt-[60px] grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-4">
            {[
              { n: stats.boards.toLocaleString("en-IN"), l: "Sites owned" },
              { n: stats.cities, l: "Cities covered" },
              { n: stats.liveBrands, l: "Brands running now" },
              { n: stats.available, l: "Free this month" },
            ].map((s, i) => (
              <Reveal key={s.l} amplitude={30 + (i % 2) * 20}>
                <dt className="t-headline tabular-nums">{s.n}</dt>
                <dd className="t-small mt-2" style={{ color: "var(--sk-glyph-gray-secondary)" }}>{s.l}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- featured */}
      <section className="sec" style={{ background: "var(--sk-fill-tertiary)" }}>
        <div className="grid-w">
          <Reveal as="section">
            <p className="t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>Available now</p>
            <h2 className="t-headline mt-2 max-w-[16ch]">Junagadh, this month.</h2>
          </Reveal>

          <ul className="mt-[60px] grid gap-6 md:grid-cols-3">
            {featured.map((b, i) => (
              <Reveal key={b.code} as="li" amplitude={i === 1 ? 80 : 50}>
                <Link href={`/boards?board=${b.code}`} className="group block">
                  <div className="tile" style={{ background: "var(--sk-fill)" }}>
                    <div className="aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.photo!}
                        alt=""
                        className="size-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
                        style={{ transitionTimingFunction: "cubic-bezier(0,0,.5,1)" }}
                      />
                    </div>
                    <div className="p-7">
                      <p className="t-caption" style={{ color: "var(--sk-glyph-gray-tertiary)" }}>{b.code}</p>
                      <h3 className="t-title mt-1.5">{titleCase(b.location ?? "")}</h3>
                      <p className="t-small mt-2" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
                        {b.widthFt}×{b.heightFt} ft
                        {b.lighting === "backlit" && " · Back-lit"}
                      </p>
                      <p className="t-body mt-5">
                        {inr(b.askingRate ?? 0)}
                        <span style={{ color: "var(--sk-glyph-gray-secondary)" }}> / month</span>
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <div className="mt-12 text-center">
              <Link href="/boards" className="btn btn-quiet">
                Browse all {stats.available} available sites
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------- strip */}
      <section className="sec">
        <div className="grid-w">
          <Reveal as="section">
            <h2 className="t-headline max-w-[18ch]">Every site, photographed from the road.</h2>
            <p className="t-intro mt-[1.2em] max-w-[44ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
              Not a floor plan or a dot on a map. The actual approach, the actual traffic,
              the actual sightline.
            </p>
          </Reveal>
        </div>

        <div className="mt-[60px] flex gap-5 overflow-x-auto px-[max(1.5rem,calc((100vw-var(--grid))/2))] pb-4">
          {strip.map((b, i) => (
            <Reveal key={b.code} amplitude={i % 2 ? 80 : 50} className="shrink-0">
              <div className="tile w-[380px]">
                <div className="aspect-[3/2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.photo!} alt="" className="size-full object-cover" />
                </div>
              </div>
              <p className="t-small mt-3" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
                {titleCase(b.location ?? "")}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- coverage */}
      <section className="sec" style={{ background: "var(--sk-fill-tertiary)" }}>
        <div className="grid-w">
          <Reveal as="section">
            <h2 className="t-headline max-w-[14ch]">Where we are.</h2>
            <p className="t-intro mt-[1.2em] max-w-[46ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
              {PUBLIC_CITIES.join(" · ")}
            </p>
            <div className="mt-10">
              <Link href="/boards" className="btn">Open the map</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- contact */}
      <section id="contact" className="sec scroll-mt-16">
        <div className="grid-w grid gap-14 lg:grid-cols-[1fr_minmax(0,420px)]">
          <Reveal as="section">
            <h2 className="t-headline max-w-[13ch]">Tell us the city.</h2>
            <p className="t-intro mt-[1.2em] max-w-[40ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
              We&rsquo;ll come back with what&rsquo;s free, what it costs, and photos of each one.
            </p>
          </Reveal>
          <Reveal amplitude={60}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
