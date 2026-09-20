import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] material-thick">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="text-title3 font-[680] tracking-[-0.02em] text-ink-0">
          DV Outdoor
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/boards"
            className="rounded-[var(--radius-control)] px-4 py-2 text-subhead font-[520] text-ink-300 transition-colors hover:text-ink-0"
          >
            Inventory
          </Link>
          <Link
            href="/boards"
            className="rounded-[var(--radius-pill)] bg-accent px-5 py-2 text-subhead font-[590] text-accent-on transition-colors hover:bg-accent-hover"
          >
            Check availability
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] px-6 py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-title3 font-[680] text-ink-0">DV Outdoor</p>
          <p className="mt-1.5 max-w-[380px] text-footnote leading-relaxed text-ink-500">
            Outdoor advertising across Saurashtra and Gujarat. Hoardings, unipoles and
            gantries, owned and maintained by us.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-footnote">
          <Link href="/boards" className="text-ink-300 transition-colors hover:text-ink-0">
            Browse inventory
          </Link>
          <Link href="/login" className="text-ink-500 transition-colors hover:text-ink-200">
            Staff sign in
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1200px] text-caption text-ink-600">
        © {new Date().getFullYear()} DV Outdoor Advertising
      </p>
    </footer>
  );
}
