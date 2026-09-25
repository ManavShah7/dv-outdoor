import Link from "next/link";
import { SALES_EMAIL } from "@/lib/sales";

export function TimesFoot() {
  return (
    <footer className="tm-dark tm-foot tm-rt tm-t25 tm-caps">
      <p style={{ fontWeight: 700 }}>The Times Media</p>
      <nav className="tm-foot__links">
        <Link href="/boards">Map</Link>
        <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
        <Link href="/login">Staff login</Link>
      </nav>
      <p>© {new Date().getFullYear()} The Times Media · Rajkot</p>
    </footer>
  );
}
