import Link from "next/link";

export function TimesFoot() {
  return (
    <footer className="tm-dark tm-foot tm-rt tm-t25 tm-caps">
      <p style={{ fontWeight: 700 }}>The Times Media</p>
      <nav className="tm-foot__links">
        <Link href="/boards">Map</Link>
        <a href="#contact">Contact</a>
        <Link href="/login">Staff login</Link>
      </nav>
      <p>© {new Date().getFullYear()} The Times Media · Rajkot</p>
    </footer>
  );
}
