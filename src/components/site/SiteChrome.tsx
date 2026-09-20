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
      style={{ borderColor: "var(--w-line)", background: "rgba(255,255,255,.9)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="text-[21px] font-[700] tracking-[-0.03em]" style={{ color: "var(--w-text)" }}>
          DV Outdoor
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[15px] font-[500]" style={{ color: "var(--w-mid)" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-[15px]" style={{ color: "var(--w-soft-text)" }}>Staff login</Link>
          <Link
            href="/#contact"
            className="rounded-full px-5 py-2.5 text-[15px] font-[600] text-white"
            style={{ background: "var(--w-accent)" }}
          >
            Contact us
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="md:hidden" style={{ color: "var(--w-text)" }}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t px-6 py-3 md:hidden" style={{ borderColor: "var(--w-line)" }}>
          {[...NAV, { href: "/#contact", label: "Contact" }, { href: "/login", label: "Staff login" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-2.5 text-[16px]" style={{ color: "var(--w-text)" }}>
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
    <footer className="border-t" style={{ borderColor: "var(--w-line)", background: "var(--w-soft)" }}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="max-w-[340px]">
          <p className="text-[19px] font-[700] tracking-[-0.03em]" style={{ color: "var(--w-text)" }}>DV Outdoor</p>
          <p className="mt-2.5 text-[14px] leading-relaxed" style={{ color: "var(--w-soft-text)" }}>
            Hoardings, unipoles and gantries across Saurashtra and Gujarat.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Link href="/boards" className="text-[14px]" style={{ color: "var(--w-mid)" }}>Billboards</Link>
          <Link href="/#contact" className="text-[14px]" style={{ color: "var(--w-mid)" }}>Contact</Link>
          <Link href="/login" className="text-[14px]" style={{ color: "var(--w-soft-text)" }}>Staff login</Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-6 pb-8">
        <p className="text-[13px]" style={{ color: "var(--w-faint)" }}>
          © {new Date().getFullYear()} DV Outdoor Advertising · Rajkot
        </p>
      </div>
    </footer>
  );
}
