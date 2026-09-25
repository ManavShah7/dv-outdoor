/**
 * Headline left, a night shot of moving traffic right. The photo is the
 * argument — a board is worth what passes it.
 */
export function TimesHero({ shot }: { shot: string }) {
  return (
    <section className="tm-hero tm-rb">
      <div className="tm-hero__copy">
        <h1 className="tm-display tm-t60">
          We make<br />
          your stories<br />
          heard <span className="tm-red">by</span><br />
          <span className="tm-red">millions.</span>
        </h1>
      </div>
      <div className="tm-hero__shot">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage */}
        <img src={shot} alt="Traffic moving past hoardings at night" />
      </div>
    </section>
  );
}
