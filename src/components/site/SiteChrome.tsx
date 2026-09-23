"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/boards", label: "Billboards" },
  { href: "/#how", label: "How it works" },
  { href: "/#coverage", label: "Coverage" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: "var(--sk-fill-gray-tertiary)", background: "rgba(250,250,252,.8)", backdropFilter: "saturate(180%) blur(20px)" }}
    >
      <div className="grid-w flex h-[52px] items-center justify-between">
        <Link href="/" className="t-title" style={{ color: "var(--sk-glyph-gray)" }}>
          DV Outdoor
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="t-small" style={{ color: "var(--sk-glyph-gray-secondary-alt)" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>Staff login</Link>
          <Link
            href="/#contact"
            className="btn" style={{ fontSize: 14, padding: "9px 16px" }}
          >
            Contact us
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="md:hidden" style={{ color: "var(--sk-glyph-gray)" }}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t px-6 py-3 md:hidden" style={{ borderColor: "var(--sk-fill-gray-tertiary)" }}>
          {[...NAV, { href: "/#contact", label: "Contact" }, { href: "/login", label: "Staff login" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-2.5 t-body" style={{ color: "var(--sk-glyph-gray)" }}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--sk-fill-gray-tertiary)", background: "var(--sk-fill-tertiary)" }}>
      <div className="grid-w flex flex-col gap-8 py-14 sm:flex-row sm:justify-between">
        <div className="max-w-[340px]">
          <p className="t-title" style={{ color: "var(--sk-glyph-gray)" }}>DV Outdoor</p>
          <p className="mt-2.5 t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>
            Hoardings, unipoles and gantries across Saurashtra and Gujarat.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Link href="/boards" className="t-small" style={{ color: "var(--sk-glyph-gray-secondary-alt)" }}>Billboards</Link>
          <Link href="/#contact" className="t-small" style={{ color: "var(--sk-glyph-gray-secondary-alt)" }}>Contact</Link>
          <Link href="/login" className="t-small" style={{ color: "var(--sk-glyph-gray-secondary)" }}>Staff login</Link>
        </div>
      </div>
      <div className="grid-w pb-10">
        <p className="t-caption" style={{ color: "var(--sk-glyph-gray-tertiary)" }}>
          © {new Date().getFullYear()} DV Outdoor Advertising · Rajkot
        </p>
      </div>
    </footer>
  );
}
