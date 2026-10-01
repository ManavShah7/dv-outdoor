import Link from "next/link";
import { assetUrl } from "@/lib/assets";
import { HeroClip } from "@/components/times/HeroClip";
import { LiveStreetView } from "@/components/times/LiveStreetView";
import { LiveHeatmap } from "@/components/times/LiveHeatmap";

/**
 * The Times Media landing page, band by band, from the 1900-wide frame.
 * Layout reasoning lives in the `.tm` block in globals.css.
 */

function Shot({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`tm-shot ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
      <img src={src} alt={alt} />
    </div>
  );
}

/**
 * Optical sizing, not a shared box. These four marks run from 8:1 to 3:2, so
 * one shared height made Hyundai fill its space while Tanishq sat marooned
 * in the middle of its own. Each carries whichever dimension governs it, at
 * the value that makes the four read as equals — which matters more now that
 * they stand on the page with no cell around them.
 */
const CLIENTS = [
  { name: "Tanishq",                    file: "tanishq.svg", h: 78 },
  { name: "Hyundai",                    file: "hyundai.svg", w: 280 },
  { name: "Berger Paints",              file: "berger.png",  h: 98 },
  { name: "Podar International School", file: "podar.png",   w: 210 },
];

export function Nav() {
  return (
    <header className="tm-nav tm-rt tm-rb">
      {/* The frame leaves this cell empty and the second revision kept it
          empty, so it stays empty. The earlier objection — a site with no
          wordmark and no way home — does not apply on the home page itself:
          you are already home, and /boards keeps its own wordmark. */}
      <div className="tm-nav__mark" />
      <nav className="tm-nav__links tm-t25 tm-caps" style={{ fontWeight: 500 }}>
        <a href="#roads">About us</a>
        <Link href="/boards">Map</Link>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section className="tm-hero tm-rb">
      <div className="tm-hero__copy">
        <h1 className="tm-t41 tm-caps">
          We make your{" "}<br className="tm-br" />stories heard by{" "}<br className="tm-br" />millions.
        </h1>
        {/* the frame repeats the headline here as placeholder body copy */}
        <p className="tm-t25 tm-caps tm-hero__sub">
          600+ hoardings across Saurashtra — ours, maintained by us, rented
          directly to you.
        </p>
      </div>
      <HeroClip
        src={assetUrl("site/hero.mp4")}
        poster={assetUrl("site/hero-poster.jpg")}
        alt="Traffic moving past lit hoardings at night"
        className="tm-hero__shot"
      />
    </section>
  );
}

export function CtaRow() {
  return (
    <section className="tm-cta-row tm-rb">
      <div className="tm-cta-row__box">
        <span className="tm-cta-wrap">
          <Link href="/boards" className="tm-cta">
            View map
            <span className="tm-cta__dot" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4"
                   strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
            </span>
          </Link>
        </span>
      </div>
      {/* The frame leaves this cell blank. Client marks are what a media
          owner is actually judged on, so four of them stand here — no cells,
          no label, nothing explaining them. They are greyscaled: four
          full-colour lockups beside a black-and-white layout read as a
          foreign object. */}
      <div className="tm-cta-row__rest">
        <ul className="tm-clients">
          {CLIENTS.map((c) => (
            <li key={c.name}>
              {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
              <img
                src={assetUrl(`site/logos/${c.file}`)}
                alt={c.name}
                style={
                  c.h
                    ? { height: `calc(${c.h} * var(--u))` }
                    : { width: `calc(${c.w} * var(--u))` }
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STATS = [
  { n: "600+", label: "Billboards" },
  { n: "5", label: "Cities covered" },
  { n: "100s", label: "Brands" },
];

export function Stats() {
  return (
    <section className="tm-dark tm-stats tm-rb">
      {STATS.map((s) => (
        <div key={s.label} className="tm-stats__cell">
          <span className="tm-t60">{s.n}</span>
          <span className="tm-t41 tm-caps tm-stats__l">{s.label}</span>
        </div>
      ))}
    </section>
  );
}

export function Roads() {
  return (
    <section id="roads" className="tm-dark tm-split tm-rb">
      <div className="tm-split__copy">
        <h2 className="tm-t41 tm-caps">
          Covering major roads{" "}<br className="tm-br" />across Saurashtra.
        </h2>
        <p className="tm-t25 tm-caps tm-split__body">
          Our media reaches 7 out of 10 residents in major cities in Saurashtra.
        </p>
      </div>
      <div className="tm-split__fig">
        <Shot src={assetUrl("site/hero.jpg")} alt="A main road at night, lined with hoardings" />
      </div>
    </section>
  );
}

export function StreetView() {
  return (
    <section className="tm-dark tm-split tm-split--mirror tm-rb">
      <div className="tm-split__copy">
        <h2 className="tm-t41 tm-caps">
          With 3D Street View,{" "}<br className="tm-br" />see it live, before it&rsquo;s{" "}<br className="tm-br" />actually live.
        </h2>
        <p className="tm-t25 tm-caps tm-split__body">
          See exactly where your board sits with a full 3D street view.
        </p>
      </div>
      <div className="tm-split__fig">
        {/* a real panorama, not a picture of one — the band claims you can
            see it live, and dragging it is the proof */}
        <LiveStreetView lat={21.5222} lng={70.4579} caption="Motibaug Road, Junagadh" />
      </div>
    </section>
  );
}

export function Reach() {
  return (
    <section className="tm-dark tm-reach">
      <h2 className="tm-t41 tm-caps">
        Know your reach before you commit.{" "}<br className="tm-br" />View real traffic data around it.
      </h2>
      <div className="tm-reach__fig">
        <LiveHeatmap lat={22.3039} lng={70.8022} zoom={12} />
      </div>
    </section>
  );
}
