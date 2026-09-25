import { text } from "@/components/times/fonts";
import { Nav, Hero, CtaRow, Gap, Stats, Roads, StreetView, Reach } from "@/components/times/sections";
import { TimesContact } from "@/components/times/TimesContact";
import { TimesFoot } from "@/components/times/TimesFoot";

export const metadata = {
  title: "The Times Media — billboards across Saurashtra",
  description:
    "600+ billboards across Saurashtra, ours, maintained by us and rented directly to you. See every site on the map, in Street View, before you commit.",
};

export default function LandingPage() {
  return (
    <div className={`tm ${text.variable}`}>
      <div className="tm-frame">
        <Nav />
        <Hero />
        <CtaRow />
        <Gap />
        <Stats />
        <Roads />
        <StreetView />
        <Reach />
        <TimesContact />
        <TimesFoot />
      </div>
    </div>
  );
}
