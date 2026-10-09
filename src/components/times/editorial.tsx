import Link from "next/link";
import { assetUrl, boardPhotoUrl } from "@/lib/assets";
import { SALES_EMAIL } from "@/lib/sales";
import { Reveal } from "@/components/times/Reveal";
import { HeroClip } from "@/components/times/HeroClip";
import { EdNav } from "@/components/times/EdNav";
import type { PublicBoard } from "@/lib/publicBoards";

/**
 * The landing page.
 *
 * Cut down from eight sections to five. The previous build gave every band
 * its own device — a serif display with an italicised word and a coloured
 * full stop, a sentence with oversized numerals set into it, two dark plates
 * composed differently, a numbered credit list, three separate maps — and the
 * accumulation is what kept reading as generated. A page that performs a new
 * trick every screen is not a company talking.
 *
 * What is left is what a billboard company actually has to say: what we own,
 * who has been on them, what they look like, where they are, how to ask. The
 * photographs carry it.
 *
 * Removed with the sections, and one import away if they are wanted back:
 * LiveLayers (the five-layer map, which /boards already is) and
 * LiveStreetView (the panorama, which every board panel on /boards opens).
 */

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* These run from 8:1 to 3:2, so one shared height made Hyundai fill its space
   while Tanishq sat marooned in the middle of its own. */
const CLIENTS = [
  { name: "Tanishq",                    file: "tanishq.svg", h: 44, dim: 1 },
  { name: "Hyundai",                    file: "hyundai.svg", w: 150, dim: 1 },
  { name: "Berger Paints",              file: "berger.png",  h: 52, dim: 0.9 },
  { name: "Podar International School", file: "podar.png",   w: 112, dim: 0.78 },
];

export function Landing({ boards }: { boards: PublicBoard[] }) {
  /* Only JUN-001 to JUN-026 have been photographed on site. */
  const shot = boards.filter((b) => /^JUN-0(0[1-9]|1[0-9]|2[0-6])$/.test(b.code));

  return (
    <>
      <EdNav />

      {/* ---- hero ---- */}
      <section className="ed-hero ed-wrap">
        <Reveal className="ed-hero__copy">
          <h1 className="ed-h1">We make your stories heard by millions.</h1>
          <p className="ed-lead ed-hero__lead">
            600+ hoardings, unipoles and gantries across five cities in
            Saurashtra. We own them, we maintain them, and you rent them from us
            directly.
          </p>
          <div className="ed-hero__act">
            <Link href="/boards" className="ed-cta">See every site {ARROW}</Link>
          </div>
        </Reveal>
        <Reveal delay={90} className="ed-film">
          <HeroClip
            src={assetUrl("site/hero.mp4")}
            poster={assetUrl("site/hero-poster.jpg")}
            alt="Traffic moving past lit hoardings at night"
          />
        </Reveal>
      </section>

      {/* ---- the marks ---- */}
      <section className="ed-clients">
        <Reveal className="ed-wrap ed-clients__in">
          <span className="ed-label">Seen on our boards</span>
          <ul>
            {CLIENTS.map((c) => (
              <li key={c.name}>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
                <img
                  src={assetUrl(`site/logos/${c.file}`)}
                  alt={c.name}
                  style={{
                    ...(c.h ? { height: `${c.h}px` } : { width: `${c.w}px` }),
                    ...({ "--mark-dim": c.dim } as Record<string, string | number>),
                  }}
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ---- the boards themselves ---- */}
      <section className="ed-sec">
        <Reveal className="ed-wrap ed-head">
          <h2 className="ed-h2">A few of the Junagadh sites.</h2>
          <span className="ed-label">Photographed on site</span>
        </Reveal>
        <Reveal delay={60} as="div" className="ed-rail">
          {shot.map((b) => (
            <figure key={b.code}>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
                <img src={boardPhotoUrl(b.code)} alt={`${b.name}, ${b.area}, Junagadh`} loading="lazy" />
              </div>
              <figcaption>
                <span className="ed-cap" style={{ color: "var(--ink)" }}>{b.code}</span>
                <span className="ed-cap">{b.area}</span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </section>

      {/* ---- where they are ---- */}
      <section id="roads" className="ed-sec ed-sec--line ed-wrap">
        <Reveal className="ed-head">
          <div>
            <h2 className="ed-h2">Where the boards are.</h2>
            <p className="ed-lead" style={{ marginTop: "0.7em" }}>
              Every site we own, on the road network that carries it. Open the
              map to see any one of them in Street View before you book it.
            </p>
            <p style={{ marginTop: "1.2em" }}>
              <Link href="/boards" className="ed-link">Open the map</Link>
            </p>
          </div>
        </Reveal>
        <Reveal delay={60} className="ed-map">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
          <img
            src={assetUrl("site/saurashtra.png")}
            alt="The major road network of Saurashtra with every Times Media site marked"
          />
        </Reveal>
        <Reveal delay={110}>
          <p className="ed-cap" style={{ marginTop: 14, maxWidth: "52ch" }}>
            Drawn from OpenStreetMap. There is no coastline in this picture; the
            shape of the peninsula is its roads.
          </p>
        </Reveal>
      </section>
    </>
  );
}

export function EdFoot() {
  return (
    <footer className="ed-foot">
      <div className="ed-wrap ed-foot__in">
        <span className="ed-label" style={{ color: "var(--ink)" }}>The Times Media</span>
        <nav className="ed-foot__links">
          <Link href="/boards" className="ed-label">Map</Link>
          <a href={`mailto:${SALES_EMAIL}`} className="ed-label">{SALES_EMAIL}</a>
          <Link href="/login" className="ed-label">Staff login</Link>
        </nav>
        <span className="ed-label">© {new Date().getFullYear()} · Rajkot, Gujarat</span>
      </div>
    </footer>
  );
}
