import Link from "next/link";

/**
 * Logo cell and links, split by a rule at x=559 of the 1900 frame.
 * "THE" sits at x=74 and "TIMES MEDIA" is indented to x=171 — that
 * stagger is the mark, not a typo.
 */
export function TimesNav() {
  return (
    <header className="tm-nav tm-rt tm-rb">
      <div className="tm-nav__mark">
        <Link href="/" className="tm-display tm-t45 block">
          <span className="block">The</span>
          <span className="block" style={{ paddingLeft: "calc(97 * var(--u))" }}>
            Times <span className="tm-red">Media</span>
          </span>
        </Link>
      </div>
      <nav className="tm-nav__links">
        <a href="#reach" className="tm-link">About us</a>
        <a href="#contact" className="tm-link">Contact</a>
        <Link href="/boards" className="tm-link">View boards</Link>
      </nav>
    </header>
  );
}
