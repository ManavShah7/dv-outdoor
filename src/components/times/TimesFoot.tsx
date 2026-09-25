import Link from "next/link";

export function TimesFoot() {
  return (
    <footer className="tm-foot">
      <p className="tm-display tm-t41">The <span className="tm-red">Times Media</span></p>
      <nav className="tm-foot__links tm-t31">
        <Link href="/boards">Boards</Link>
        <a href="#contact">Contact</a>
        <Link href="/login">Staff login</Link>
      </nav>
      <p className="tm-t31">© {new Date().getFullYear()} The Times Media · Rajkot</p>
    </footer>
  );
}
