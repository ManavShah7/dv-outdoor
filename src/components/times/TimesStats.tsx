/**
 * Three cells on the 1900 frame's thirds. The artwork centred the first
 * cell's content ~30px left of its axis and dropped the third cell 7px;
 * both are nudges, so all three are centred here.
 */
const STATS = [
  { n: "600", label: "Billboards" },
  { n: "5", label: "Cities covered" },
  { n: "100s", label: "Brands" },
];

export function TimesStats() {
  return (
    <section className="tm-stats tm-rb">
      {STATS.map((s) => (
        <div key={s.label} className="tm-stats__cell">
          <span className="tm-stats__n">{s.n}</span>
          <span className="tm-stats__l">{s.label}</span>
        </div>
      ))}
    </section>
  );
}
