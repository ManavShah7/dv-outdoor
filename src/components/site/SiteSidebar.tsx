"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MapPinned, PhoneCall, Route } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",         label: "Overview",   icon: LayoutGrid },
  { href: "/boards",   label: "Billboards", icon: MapPinned },
  { href: "/#how",     label: "How it works", icon: Route },
  { href: "/#contact", label: "Contact",    icon: PhoneCall },
] as const;

type Counts = { total: number; available: number; booked: number; cities: number };

const BREAKDOWN = [
  { key: "available" as const, label: "Available", color: "var(--color-available)" },
  { key: "booked" as const,    label: "Booked",    color: "var(--color-booked)" },
];

/** Same shell as the admin sidebar — wordmark, nav, live counts, footer action. */
export function SiteSidebar({ counts }: { counts: Counts }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[328px] shrink-0 flex-col material-thick border-r border-white/[0.06]">
      <div className="flex h-[108px] items-center border-b border-white/[0.07] px-10">
        <Link href="/" className="text-title3 font-[680] tracking-[-0.02em] text-ink-0">
          DV Outdoor
        </Link>
      </div>

      <nav className="border-b border-white/[0.07] py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/boards" ? pathname === "/boards" : pathname === "/" && href === "/";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex h-[52px] w-full items-center gap-[22px] px-10 text-left transition-colors duration-150",
                isActive ? "text-ink-0" : "text-ink-300 hover:text-ink-0",
              )}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Icon
                className="size-[22px] shrink-0"
                strokeWidth={isActive ? 2.1 : 1.8}
                style={isActive ? { color: "var(--accent)" } : undefined}
              />
              <span className="text-body font-[520]">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="rounded-[var(--radius-card)] material-inset p-5 ring-1 ring-white/[0.07] ring-inset">
          <div className="text-caption2 uppercase text-ink-500">Sites across {counts.cities} cities</div>
          <div className="mt-1 text-display font-[680] tabular-nums text-ink-0">
            {counts.total.toLocaleString("en-IN")}
          </div>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-white/[0.07] pt-4">
            {BREAKDOWN.map((b) => (
              <div key={b.key} className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: b.color }} />
                <span className="flex-1 text-footnote text-ink-300">{b.label}</span>
                <span className="text-footnote font-[620] tabular-nums" style={{ color: b.color }}>
                  {counts[b.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.07] p-5">
        <Link
          href="/#contact"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent text-subhead font-[590] text-accent-on transition-colors hover:bg-accent-hover"
        >
          <PhoneCall className="size-4" strokeWidth={2.2} />
          Contact us
        </Link>
        <Link
          href="/login"
          className="mt-2 flex h-9 w-full items-center justify-center text-footnote text-ink-500 transition-colors hover:text-ink-200"
        >
          Staff login
        </Link>
      </div>
    </aside>
  );
}
