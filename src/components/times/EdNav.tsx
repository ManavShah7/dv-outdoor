"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The mark: a hoarding reduced to the two things that make one — a panel at
 * roughly 2:1, which is what a board actually is, on two legs. No curves and
 * no colour, because there are none in the rest of the identity.
 */
function Mark() {
  return (
    <svg className="ed-mark" viewBox="0 0 46 45" aria-hidden focusable="false">
      <rect x="0" y="0" width="46" height="24" fill="currentColor" />
      <rect x="9.5" y="24" width="3.2" height="21" fill="currentColor" />
      <rect x="33.3" y="24" width="3.2" height="21" fill="currentColor" />
    </svg>
  );
}

/**
 * Sticky, and transparent until it has earned a background.
 *
 * The hero's first line sits right under the nav, so a frosted bar from the
 * first frame would cut across it. The backdrop only arrives once the page
 * has actually moved — which is also the only moment it is needed, since
 * that is when content starts passing underneath.
 *
 * Read with a scroll listener rather than an IntersectionObserver sentinel:
 * one boolean off scrollY, flipped at a threshold, is less machinery than a
 * zero-height element and a second observer.
 */
export function EdNav() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll(); // a reload partway down should open already frosted
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="ed-nav" {...(stuck ? { "data-stuck": "" } : {})}>
      <div className="ed-wrap ed-nav__in">
        <Link href="/" className="ed-logo" aria-label="The Times Media, home">
          <Mark />
          <span className="ed-logo__word">The Times Media</span>
        </Link>
        <nav className="ed-nav__links">
          <a href="#roads">About</a>
          <Link href="/boards">Map</Link>
          <a href="#contact" className="ed-nav__cta">Enquire</a>
        </nav>
      </div>
    </header>
  );
}
