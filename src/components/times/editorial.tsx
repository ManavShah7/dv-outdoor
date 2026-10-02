import Link from "next/link";
import { assetUrl } from "@/lib/assets";
import { SALES_EMAIL } from "@/lib/sales";
import { inr } from "@/lib/utils";
import { Reveal } from "@/components/times/Reveal";
import { HeroClip } from "@/components/times/HeroClip";
import { EdNav } from "@/components/times/EdNav";
import { LiveStreetView } from "@/components/times/LiveStreetView";
import { LiveLayers } from "@/components/times/LiveLayers";
import type { PublicBoard } from "@/lib/publicBoards";
import type { Hotspot } from "@/lib/hotspots.db";

/**
 * The landing page.
 *
 * The first editorial pass was tasteful and characterless, for reasons worth
 * writing down because they are easy to repeat: three sections built from one
 * template (eyebrow, serif heading with a single italicised word, lead,
 * figure, italic caption, plate number), two numbering systems running at
 * once, three equally weighted figures where there should have been a
 * hierarchy, aphorisms in place of facts, and not one element touching an
 * edge. Uniform spacing and uniform weight read as generated whatever the
 * typeface is.
 *
 * So the sections no longer share a structure. One is a standfirst, one a
 * full-bleed plate with its heading lapped over the image, one a dense
 * specification of a real board's real fields, one a plate again. The italic
 * appears twice on the whole page and the accent twice, rather than in every
 * heading. Density alternates with air instead of averaging out to neither.
 */

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* Per-logo optical sizing: these run from 8:1 to 3:2, and one shared height
   made Hyundai fill its space while Tanishq sat marooned in the middle of
   its own. */
const CLIENTS = [
  { name: "Tanishq",                    file: "tanishq.svg", h: 46, dim: 1 },
  { name: "Hyundai",                    file: "hyundai.svg", w: 158, dim: 1 },
  { name: "Berger Paints",              file: "berger.png",  h: 56, dim: 0.9 },
  { name: "Podar International School", file: "podar.png",   w: 118, dim: 0.78 },
];

const FACTS: [string, string][] = [
  ["Owned outright", "Not brokered, not resold. Every site on the map is ours to let."],
  ["Mapped site by site", "Exact coordinates rather than an area listing. Open any one in Street View."],
  ["Maintained by us", "Our own crew, a QR sticker on every frame, and a photograph after each repair."],
];

/** The five with the most inventory, which is what the figure in the
 *  standfirst refers to. */
const CITIES = ["Rajkot", "Jamnagar", "Bhavnagar", "Junagadh", "Porbandar"];

const SOURCES = [
  { name: "Live traffic", who: "Google" },
  { name: "Major roads", who: "OpenStreetMap" },
  { name: "Population", who: "Kontur, CC BY" },
  { name: "Night lights", who: "NASA VIIRS" },
  { name: "Landmarks", who: "OpenStreetMap" },
];

/** The site the Street View section stands at — one of the Junagadh boards
 *  with a Google panorama within reach of its own pole. */
const SHOWN_CODE = "JUN-022";

function lightingLabel(l: PublicBoard["lighting"]) {
  return l === "backlit" ? "Back-lit" : l === "frontlit" ? "Front-lit" : "Non-lit";
}

export function Landing({
  boards,
  hotspots,
}: {
  boards: PublicBoard[];
  hotspots: Hotspot[];
}) {
  const site = boards.find((b) => b.code === SHOWN_CODE) ?? boards[0];

  return (
    <>
      <EdNav />

      {/* ---- hero ---- */}
      <section className="ed-hero ed-hero--bleed">
        <Reveal as="span" className="ed-label" style={{ display: "block" }}>
          Outdoor advertising · Saurashtra, Gujarat
        </Reveal>

        <Reveal as="h1" delay={60} className="ed-display ed-hero__h1"
                style={{ marginTop: "clamp(18px, 2vw, 34px)" }}>
          We make your stories <span className="ed-i">heard</span> by millions
          <span className="ed-stop">.</span>
        </Reveal>

        <div className="ed-hero__under">
          <Reveal delay={140} className="ed-hero__col">
            <p className="ed-lead ed-hero__lead">
              600+ hoardings, unipoles and gantries across Saurashtra. We own
              them, we maintain them, and you rent them from us — there is no
              agency in the middle.
            </p>
            <div className="ed-hero__actions">
              <Link href="/boards" className="ed-cta">
                See every site {ARROW}
              </Link>
              <a href="#contact" className="ed-link">Get a quote</a>
            </div>
            <div className="ed-cities">
              <span className="ed-label">Cities</span>
              <ul>
                {CITIES.map((c) => <li key={c}>{c}</li>)}
              </ul>
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

      {/* ---- the figures, set as a sentence rather than three cells ---- */}
      <section className="ed-stand ed-wrap">
        <Reveal as="p" className="ed-stand__line">
          <b>600+</b> hoardings across <b>5</b> cities, booked direct by
          <b> 100s</b> of brands.
        </Reveal>
        <div className="ed-stand__facts">
          {FACTS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 80} className="ed-stand__fact">
              <span className="ed-label">{t}</span>
              <p className="ed-body">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- plate · coverage. Full bleed, heading lapped over the figure ---- */}
      <section id="roads" className="ed-band ed-dark">
        <div className="ed-plate ed-wrap">
          <Reveal as="h2" className="ed-h2 ed-plate__head">Where they are.</Reveal>
          <Reveal delay={90} className="ed-plate__fig">
            <div className="ed-frame ed-frame--map" style={{ outline: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
              <img
                src={assetUrl("site/saurashtra.png")}
                alt="The major road network of Saurashtra with all 650 Times Media sites marked"
              />
            </div>
          </Reveal>
          <Reveal delay={150} className="ed-plate__foot">
            <span className="ed-cap" style={{ maxWidth: "46ch" }}>
              Every site we own, on the road network that carries it. The shape of
              the peninsula is the roads — there is no coastline in this drawing.
            </span>
            <span className="ed-label">Roads: OpenStreetMap</span>
          </Reveal>
        </div>
      </section>

      {/* ---- the dense one. One real site: panorama and specification ---- */}
      <section className="ed-spread ed-wrap" style={{ borderTop: "none" }}>
        <div className="ed-site__in">
          <Reveal className="ed-spread__fig">
            <LiveStreetView lat={site.lat} lng={site.lng} caption={`${site.code} · ${site.area}`} />
          </Reveal>
          <div>
            <Reveal as="h2" className="ed-h2">Stand at the pole before you book it.</Reveal>
            <Reveal delay={80}>
              <p className="ed-lead" style={{ marginTop: "0.8em", maxWidth: "34ch" }}>
                Every site opens into Street View at its own coordinates. Judge the
                approach and the clutter around it the way a driver will.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <dl className="ed-spec" style={{ marginTop: "clamp(22px, 2.2vw, 36px)" }}>
                <dt>Site</dt><dd>{site.code}</dd>
                <dt>Where</dt><dd>{site.name}</dd>
                <dt>Size</dt><dd>{site.widthFt} × {site.heightFt} ft</dd>
                <dt>Lighting</dt><dd>{lightingLabel(site.lighting)}</dd>
                <dt>Rate</dt><dd>{inr(site.askingRate)} / month</dd>
                <dt>Status</dt>
                <dd>
                  {site.availability === "available" ? (
                    <span className="ed-spec__free">
                      <span className="ed-spec__dot" /> Free now
                    </span>
                  ) : (
                    "Booked"
                  )}
                </dd>
              </dl>
            </Reveal>
            <Reveal delay={190} style={{ marginTop: "clamp(22px, 2vw, 32px)", display: "block" }}>
              <Link href={`/boards?board=${site.code}`} className="ed-link">
                Open this site
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- plate · the live map. Heading beside the figure, not over it ---- */}
      <section className="ed-band ed-dark">
        <div className="ed-plate ed-plate--side ed-wrap">
          <div className="ed-plate__in">
            <div className="ed-plate__aside">
              <Reveal as="h2" className="ed-h2 ed-plate__head">
                Where the numbers come from.
              </Reveal>
              <Reveal delay={150} className="ed-plate__foot">
                <div className="ed-credits" style={{ flexDirection: "column" }}>
                  {SOURCES.map((s) => (
                    <div key={s.name}>
                      <b>{s.name}</b>
                      <span className="ed-label">{s.who}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <Reveal delay={90} className="ed-plate__fig">
              <LiveLayers boards={boards} hotspots={hotspots} />
            </Reveal>
          </div>
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
