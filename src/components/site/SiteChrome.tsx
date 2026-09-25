"use client";

import Link from "next/link";

/** The landing page's nav, at tool scale — same mark, same caps, same rule. */
export function SiteHeader() {
  return (
    <header className="tmui-head">
      <Link href="/" className="tmui-head__mark">The Times Media</Link>
      <nav className="tmui-head__nav">
        <Link href="/boards">Map</Link>
        <Link href="/#contact">Contact</Link>
        <Link href="/login">Staff login</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer
      className="tmui-caps flex flex-wrap items-baseline justify-between gap-4 px-6 py-8"
      style={{ borderTop: "1px solid var(--ink)", fontSize: 12.5, fontWeight: 500 }}
    >
      <p style={{ fontWeight: 700 }}>The Times Media</p>
      <nav className="flex flex-wrap gap-6">
        <Link href="/boards">Map</Link>
        <Link href="/#contact">Contact</Link>
        <Link href="/login">Staff login</Link>
      </nav>
      <p>© {new Date().getFullYear()} The Times Media · Rajkot</p>
    </footer>
  );
}
