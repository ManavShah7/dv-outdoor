"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/boards", label: "Billboards" },
  { href: "/#how", label: "How it works" },
  { href: "/#coverage", label: "Coverage" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] material-thick">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-6">
        <Link href="/" className="text-title3 font-[680] tracking-[-0.02em] text-ink-0">
          DV<span className="text-accent">Outdoor</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-subhead font-[520] text-ink-300 transition-colors hover:text-ink-0">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-subhead font-[520] text-ink-400 transition-colors hover:text-ink-100">
            Staff login
          </Link>
          <Link
            href="/#contact"
            className="rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-subhead font-[590] text-accent-on transition-colors hover:bg-accent-hover"
          >
            Contact us
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} className="text-ink-0 md:hidden">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.07] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-2.5 text-body font-[520] text-ink-100">
                {n.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 text-body text-ink-500">
              Staff login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-[360px]">
            <p className="text-title3 font-[680] tracking-[-0.02em] text-ink-0">
              DV<span className="text-accent">Outdoor</span>
            </p>
            <p className="mt-3 text-subhead leading-relaxed text-ink-500">
              Hoardings, unipoles and gantries across Saurashtra and Gujarat — owned,
              maintained and rented directly by us.
            </p>
          </div>

          <div className="flex gap-14">
            <div className="flex flex-col gap-2.5">
              <p className="text-caption2 uppercase text-ink-600">Explore</p>
              <Link href="/boards" className="text-subhead text-ink-300 hover:text-ink-0">Billboards</Link>
              <Link href="/#how" className="text-subhead text-ink-300 hover:text-ink-0">How it works</Link>
              <Link href="/#contact" className="text-subhead text-ink-300 hover:text-ink-0">Contact</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-caption2 uppercase text-ink-600">Company</p>
              <Link href="/login" className="text-subhead text-ink-300 hover:text-ink-0">Staff login</Link>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-white/[0.07] pt-6 text-footnote text-ink-600">
          © {new Date().getFullYear()} DV Outdoor Advertising · Rajkot, Gujarat
        </p>
      </div>
    </footer>
  );
}
