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
    <header
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: "var(--s-line)", background: "rgba(255,255,255,0.86)", backdropFilter: "blur(14px)" }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-6">
        <Link href="/" className="text-[22px] font-[700] tracking-[-0.03em]" style={{ color: "var(--s-text)" }}>
          DV<span style={{ color: "var(--s-accent)" }}>Outdoor</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[15px] font-[500] transition-colors"
              style={{ color: "var(--s-text-mid)" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-[15px] font-[500] transition-colors"
            style={{ color: "var(--s-text-mid)" }}
          >
            Staff login
          </Link>
          <Link
            href="/#contact"
            className="rounded-full px-5 py-2.5 text-[15px] font-[600] text-white transition-colors"
            style={{ background: "var(--s-accent)" }}
          >
            Contact us
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden"
          style={{ color: "var(--s-text)" }}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t px-6 py-4 md:hidden" style={{ borderColor: "var(--s-line)" }}>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-[16px] font-[500]"
                style={{ color: "var(--s-text)" }}
              >
                {n.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 text-[16px]" style={{ color: "var(--s-text-soft)" }}>
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
    <footer className="border-t" style={{ borderColor: "var(--s-line)", background: "var(--s-bg-soft)" }}>
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-[360px]">
            <p className="text-[22px] font-[700] tracking-[-0.03em]" style={{ color: "var(--s-text)" }}>
              DV<span style={{ color: "var(--s-accent)" }}>Outdoor</span>
            </p>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--s-text-soft)" }}>
              Hoardings, unipoles and gantries across Saurashtra and Gujarat — owned,
              maintained and rented directly by us.
            </p>
          </div>

          <div className="flex gap-14">
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] font-[600] uppercase tracking-wide" style={{ color: "var(--s-text-soft)" }}>
                Explore
              </p>
              <Link href="/boards" className="text-[15px]" style={{ color: "var(--s-text-mid)" }}>Billboards</Link>
              <Link href="/#how" className="text-[15px]" style={{ color: "var(--s-text-mid)" }}>How it works</Link>
              <Link href="/#contact" className="text-[15px]" style={{ color: "var(--s-text-mid)" }}>Contact</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] font-[600] uppercase tracking-wide" style={{ color: "var(--s-text-soft)" }}>
                Company
              </p>
              <Link href="/login" className="text-[15px]" style={{ color: "var(--s-text-mid)" }}>Staff login</Link>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t pt-6 text-[13px]" style={{ borderColor: "var(--s-line)", color: "var(--s-text-soft)" }}>
          © {new Date().getFullYear()} DV Outdoor Advertising · Rajkot, Gujarat
        </p>
      </div>
    </footer>
  );
}
