import Link from "next/link";

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
