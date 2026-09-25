import Link from "next/link";
import { publicStats, liveBrandNames, PUBLIC_CITIES } from "@/lib/publicBoards";
import { getDeckBoards, titleCase } from "@/lib/junagadhBoards";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { ContactForm } from "@/components/site/ContactForm";
import { CoverageMap } from "@/components/site/CoverageMap";
import { Reveal } from "@/components/site/Reveal";

export const metadata = {
  title: "DV Outdoor — Billboard advertising across Gujarat",
  description:
    "Hoardings, unipoles and gantries across Saurashtra and Gujarat. See what's free, pick your sites, book directly with the owner.",
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default async function LandingPage() {
  const stats = publicStats();
  const brands = liveBrandNames(6);
  const b = await getDeckBoards();

  return (
    <div className="site">
      <SiteHeader />

      {/* ----------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b[0].photo!} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.28) 40%, rgba(0,0,0,.72) 100%)" }}
        />
        <div className="grid-w flex min-h-[88vh] flex-col justify-end pb-[110px] pt-[180px]">
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

      {/* -------------------------------- trusted — one tight line, no gap */}
      <div className="border-b" style={{ borderColor: "var(--sk-fill-gray-tertiary)" }}>
        <div className="grid-w flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-7">
          <span className="t-caption" style={{ color: "var(--sk-glyph-gray-tertiary)" }}>
            Trusted by
          </span>
          {brands.map((x) => (
            <span key={x} className="t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>{x}</span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------- bento: numbers + sites */}
      <section className="sec">
        <div className="grid-w">
          <Reveal as="section">
            <h2 className="t-headline max-w-[15ch]">Scale you can see from the road.</h2>
          </Reveal>

          <div className="mt-[60px] grid auto-rows-[190px] grid-cols-2 gap-5 md:grid-cols-4">
            {/* headline number */}
            <Reveal className="col-span-2 row-span-2" amplitude={40}>
              <div className="tile flex size-full flex-col justify-between p-10">
                <p className="t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>Sites owned</p>
                <div>
                  <p style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-.015em", fontWeight: 600 }}>
                    {stats.boards}
                  </p>
                  <p className="t-body mt-3 max-w-[26ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
                    across {stats.cities} cities in Saurashtra and Gujarat.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* landscape photo, same footprint */}
            <Reveal className="col-span-2 row-span-2" amplitude={70}>
              <div className="tile size-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b[4].photo!} alt="" className="size-full object-cover" />
              </div>
            </Reveal>

            {/* two small numbers */}
            {[
              { n: stats.cities, l: "Cities covered" },
              { n: stats.liveBrands, l: "Brands running now" },
            ].map((x, i) => (
              <Reveal key={x.l} amplitude={i ? 70 : 45}>
                <div className="tile flex size-full flex-col justify-between p-8">
                  <p className="t-caption" style={{ color: "var(--sk-glyph-gray-secondary)" }}>{x.l}</p>
                  <p className="tabular-nums" style={{ fontSize: 56, lineHeight: 1, fontWeight: 700, letterSpacing: "-.005em" }}>
                    {x.n}
                  </p>
                </div>
              </Reveal>
            ))}

            {/* wide photo closes the row */}
            <Reveal className="col-span-2" amplitude={55}>
              <div className="tile size-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b[7].photo!} alt="" className="size-full object-cover" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- available */}
      <section className="sec" style={{ background: "var(--sk-fill-tertiary)" }}>
        <div className="grid-w">
          <Reveal as="section">
            <p className="t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>Available now</p>
            <h2 className="t-headline mt-2 max-w-[16ch]">Junagadh, this month.</h2>
          </Reveal>

          <ul className="mt-[60px] grid gap-6 md:grid-cols-3">
            {[b[1], b[2], b[3]].map((x, i) => (
              <Reveal key={x.code} as="li" amplitude={i === 1 ? 80 : 50}>
                <Link href={`/boards?board=${x.code}`} className="group block">
                  <div className="tile" style={{ background: "var(--sk-fill)" }}>
                    <div className="aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={x.photo!}
                        alt=""
                        className="size-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
                        style={{ transitionTimingFunction: "cubic-bezier(0,0,.5,1)" }}
                      />
                    </div>
                    <div className="p-7">
                      <p className="t-caption" style={{ color: "var(--sk-glyph-gray-tertiary)" }}>{x.code}</p>
                      <h3 className="t-title mt-1.5">{titleCase(x.location ?? "")}</h3>
                      <p className="t-small mt-2" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
                        {x.widthFt}×{x.heightFt} ft{x.lighting === "backlit" && " · Back-lit"}
                      </p>
                      <p className="t-body mt-5">
                        {inr(x.askingRate ?? 0)}
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
              <Link href="/boards" className="btn btn-quiet">Browse every site</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------- full-bleed image statement */}
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b[9].photo!} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.30) 45%, rgba(0,0,0,.78) 100%)" }}
        />
        <div className="grid-w pb-[100px]">
          <Reveal amplitude={50}>
            <h2 className="t-headline max-w-[16ch]" style={{ color: "#fff" }}>
              Every site, photographed from the road.
            </h2>
            <p className="t-intro mt-[1.2em] max-w-[42ch]" style={{ color: "var(--sk-glyph-alpha-secondary)" }}>
              Not a floor plan or a dot on a map. The actual approach, the actual traffic,
              the actual sightline.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------ photo grid */}
      <section className="sec">
        <div className="grid-w">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
            {[b[10], b[12], b[14], b[16], b[18], b[20]].map((x, i) => (
              <Reveal key={x.code} as="figure" amplitude={[45, 75, 55, 85, 50, 70][i]}>
                <div className="tile aspect-[3/2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.photo!} alt="" className="size-full object-cover" />
                </div>
                <figcaption className="t-small mt-3" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
                  {titleCase(x.location ?? "")}
                  <span style={{ color: "var(--sk-glyph-gray-tertiary)" }}> · {x.widthFt}×{x.heightFt} ft</span>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- coverage */}
      <section className="sec pt-0">
        <div className="grid-w">
          <Reveal as="section">
            <h2 className="t-headline max-w-[14ch]">Where we are.</h2>
            <p className="t-intro mt-[1.2em] max-w-[46ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
              {PUBLIC_CITIES.join(" · ")}
            </p>
          </Reveal>
          <Reveal amplitude={60}>
            <div className="tile mt-[60px]">
              <CoverageMap />
            </div>
            <div className="mt-10">
              <Link href="/boards" className="btn">Open the map</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- contact */}
      <section id="contact" className="sec scroll-mt-16" style={{ background: "var(--sk-fill-tertiary)" }}>
        <div className="grid-w grid gap-14 lg:grid-cols-[1fr_minmax(0,420px)]">
          <Reveal as="section">
            <h2 className="t-headline max-w-[13ch]">Tell us the city.</h2>
            <p className="t-intro mt-[1.2em] max-w-[40ch]" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
              We&rsquo;ll come back with what&rsquo;s free, what it costs, and photos of each one.
            </p>
            <ol className="mt-12 max-w-[42ch]">
              {[
                ["You send the cities and dates", "A phone number is enough to start."],
                ["We come back the same day", "With sites, photos and prices — no broker in between."],
                ["We print, mount and maintain", "Our own crews look after every board."],
              ].map(([t, d], i) => (
                <li
                  key={t}
                  className="flex gap-5 border-t py-6 first:border-t-0 first:pt-0"
                  style={{ borderColor: "var(--sk-fill-gray-tertiary)" }}
                >
                  <span className="t-small tabular-nums" style={{ color: "var(--sk-glyph-gray-tertiary)" }}>
                    0{i + 1}
                  </span>
                  <span>
                    <span className="t-body block" style={{ fontWeight: 600 }}>{t}</span>
                    <span className="t-small mt-1 block" style={{ color: "var(--sk-glyph-gray-secondary)" }}>{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal amplitude={60}>
            <div style={{ background: "var(--sk-fill)", borderRadius: 30 }}>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
