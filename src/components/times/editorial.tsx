import Link from "next/link";
import { assetUrl } from "@/lib/assets";
import { SALES_EMAIL } from "@/lib/sales";
import { Reveal } from "@/components/times/Reveal";
import { HeroClip } from "@/components/times/HeroClip";
import { EdNav } from "@/components/times/EdNav";
import { LiveStreetView } from "@/components/times/LiveStreetView";
import { LiveLayers } from "@/components/times/LiveLayers";
import type { PublicBoard } from "@/lib/publicBoards";
import type { Hotspot } from "@/lib/hotspots.db";

/**
 * The landing page, rebuilt as an editorial spread.
 *
 * What replaced what, and why:
 *
 *   The old build reproduced a 1900-wide Figma frame by scaling every value
 *   off one --u unit. Faithful, and the reason the page read as basic — a
 *   fixed frame cannot hold motion (sticky and scroll animation only behaved
 *   at exactly 1900px), and a half-and-half hero with hairline boxes has
 *   nowhere to go. This is a real container, fluid type, and a twelve-column
 *   grid that each section takes an unequal share of.
 *
 *   The two split bands ran copy-left / photo-right twice in a row, which is
 *   what made the middle of the page feel like one long section. The spreads
 *   alternate now, and the copy column sticks while its figure travels.
 *
 *   The standalone population heatmap is gone. It was the same Kontur layer
 *   the board map already carries, so the page was paying for two Google map
 *   loads to show one dataset twice. The live board map does that work and
 *   four other layers besides.
 */

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* The marks keep their per-logo optical sizing: these four run from 8:1 to
   3:2, and one shared height made Hyundai fill its space while Tanishq sat
   marooned in the middle of its own. */
const CLIENTS = [
  { name: "Tanishq",                    file: "tanishq.svg", h: 52, dim: 1 },
  { name: "Hyundai",                    file: "hyundai.svg", w: 176, dim: 1 },
  { name: "Berger Paints",              file: "berger.png",  h: 62, dim: 0.9 },
  { name: "Podar International School", file: "podar.png",   w: 130, dim: 0.78 },
];

const FIGURES = [
  { n: "600+", lab: "Hoardings", note: "Unipoles, hoardings and gantries. All of them ours, not brokered." },
  { n: "5",    lab: "Cities covered", note: "With the inventory mapped site by site, not listed by area." },
  { n: "100s", lab: "Brands", note: "Jewellery, paint, automotive, education, retail — booked direct." },
];

const SOURCES = [
  { name: "Live traffic", who: "Google — refetched every two minutes" },
  { name: "Major roads", who: "OpenStreetMap — 10,169 classified ways" },
  { name: "Population", who: "Kontur — 400 m cells, CC BY" },
  { name: "Night lights", who: "NASA VIIRS — Suomi-NPP day/night band" },
  { name: "Landmarks", who: "OpenStreetMap — 423 junctions, markets, stations" },
];

export function Landing({
  boards,
  hotspots,
}: {
  boards: PublicBoard[];
  hotspots: Hotspot[];
}) {
  return (
    <>
      <EdNav />

      {/* ---- hero ---- */}
      <section className="ed-hero ed-wrap">
        <Reveal className="ed-hero__eyebrow">
          <span className="ed-label">Outdoor advertising · Saurashtra</span>
          <hr className="ed-rule" />
          <span className="ed-label">Rajkot, Gujarat</span>
        </Reveal>

        <Reveal as="h1" delay={60} className="ed-display ed-hero__h1">
          We make your stories <span className="ed-i">heard</span> by millions.
        </Reveal>

        <div className="ed-hero__under">
          <Reveal delay={140}>
            <p className="ed-lead ed-hero__lead">
              600+ hoardings across Saurashtra — ours, maintained by us, and
              rented to you directly. No agency in the middle.
            </p>
            <div className="ed-hero__actions">
              <Link href="/boards" className="ed-cta">
                See every site {ARROW}
              </Link>
              <a href="#contact" className="ed-link">Get a quote</a>
            </div>
          </Reveal>

          <Reveal delay={200} className="ed-hero__film">
            <div className="ed-film">
              <HeroClip
                src={assetUrl("site/hero.mp4")}
                poster={assetUrl("site/hero-poster.jpg")}
                alt="Traffic moving past lit hoardings at night"
               
              />
            </div>
            <div className="ed-film__cap">
              <span className="ed-cap">A city artery after dark, when a lit board earns its rent.</span>
              <span className="ed-label">01</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- the marks ---- */}
      <section className="ed-clients">
        <Reveal className="ed-wrap ed-clients__in">
          <span className="ed-label ed-clients__lab">Seen on our boards</span>
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

      {/* ---- the figures ---- */}
      <section className="ed-figs ed-wrap">
        <div className="ed-figs__row">
          {FIGURES.map((f, i) => (
            <Reveal key={f.lab} delay={i * 90} className="ed-fig">
              <span className="ed-num ed-fig__n">{f.n}</span>
              <span className="ed-label ed-fig__lab">{f.lab}</span>
              <Reveal as="hr" variant="rule" delay={i * 90 + 160} className="ed-rule ed-fig__rule" />
              <p className="ed-body ed-fig__note">{f.note}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- spread 1 · coverage ---- */}
      <section id="roads" className="ed-spread ed-spread--wide ed-wrap">
        <div className="ed-spread__in">
          <div className="ed-spread__copy">
            <Reveal as="span" className="ed-label">01 — Coverage</Reveal>
            <Reveal as="h2" delay={60} className="ed-h2">
              Every site we own, on the network that <span className="ed-i">carries</span> it.
            </Reveal>
            <Reveal delay={120}>
              <p className="ed-lead">
                Our media reaches 7 out of 10 residents in the major cities of
                Saurashtra. This is not an illustration of that — it is the
                road network, and our 650 sites on it.
              </p>
            </Reveal>
          </div>
          <Reveal delay={160} className="ed-spread__fig">
            <div className="ed-frame ed-frame--map">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
              <img
                src={assetUrl("site/saurashtra.png")}
                alt="The major road network of Saurashtra with all 650 Times Media sites marked"
              />
            </div>
            <div className="ed-film__cap">
              <span className="ed-cap">
                Drawn from OpenStreetMap. The peninsula is the roads — there is no
                coastline in this picture.
              </span>
              <span className="ed-label">02</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- spread 2 · street view ---- */}
      <section className="ed-spread ed-spread--flip ed-wrap">
        <div className="ed-spread__in">
          <div className="ed-spread__copy">
            <Reveal as="span" className="ed-label">02 — The site itself</Reveal>
            <Reveal as="h2" delay={60} className="ed-h2">
              Stand at the pole before you <span className="ed-i">book</span> it.
            </Reveal>
            <Reveal delay={120}>
              <p className="ed-lead">
                Every site opens into Street View at its own coordinates. Judge the
                approach, the sightline and the clutter around it the way a driver
                will — without the trip.
              </p>
            </Reveal>
            <Reveal delay={170}>
              <Link href="/boards" className="ed-link">Open the map</Link>
            </Reveal>
          </div>
          <Reveal delay={160} className="ed-spread__fig">
            <LiveStreetView lat={21.5222} lng={70.4579} caption="Motibaug Road, Junagadh" />
            <div className="ed-film__cap">
              <span className="ed-cap">Live panorama. Drag it.</span>
              <span className="ed-label">03</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- spread 3 · the data ---- */}
      <section className="ed-spread ed-wrap">
        <div className="ed-spread__in">
          <div className="ed-spread__copy">
            <Reveal as="span" className="ed-label">03 — Evidence</Reveal>
            <Reveal as="h2" delay={60} className="ed-h2">
              Five sources. One answer to <span className="ed-i">says who</span>.
            </Reveal>
            <Reveal delay={120}>
              <p className="ed-lead">
                Anyone can tell you a board is busy. Each layer here comes from a
                dataset with a name and a licence attached, and the map says which
                is which.
              </p>
            </Reveal>
            <Reveal delay={170}>
              <ol className="ed-src">
                {SOURCES.map((s) => (
                  <li key={s.name}>
                    <span className="ed-src__name">{s.name}</span>
                    <span className="ed-label ed-src__who">{s.who}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
          <Reveal delay={160} className="ed-spread__fig">
            <LiveLayers boards={boards} hotspots={hotspots} />
            <div className="ed-film__cap">
              <span className="ed-cap">
                All five layers on at once, over our own green and red pins.
              </span>
              <span className="ed-label">04</span>
            </div>
          </Reveal>
        </div>
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
