import { PUBLIC_BOARDS, PUBLIC_CITIES } from "@/lib/publicBoards";
import { assetUrl } from "@/lib/assets";
import { display, text } from "@/components/times/fonts";
import { TimesNav } from "@/components/times/TimesNav";
import { TimesHero } from "@/components/times/TimesHero";
import { TimesCta } from "@/components/times/TimesCta";
import { TimesConvey } from "@/components/times/TimesConvey";
import { TimesStats } from "@/components/times/TimesStats";
import { TimesProps } from "@/components/times/TimesProps";
import { TimesFinder } from "@/components/times/TimesFinder";
import { TimesContact } from "@/components/times/TimesContact";
import { TimesFoot } from "@/components/times/TimesFoot";

export const metadata = {
  title: "The Times Media — billboards across Saurashtra",
  description:
    "600 billboards across Saurashtra, ours, maintained by us and rented directly to you. See every site on the map before you book.",
};

/**
 * The public landing page, reproduced from Manav's 1900-wide frame.
 * Measurements and the reasoning behind the grid live in the `.tm` block
 * in globals.css.
 */
export default function LandingPage() {
  return (
    <div className={`tm ${display.variable} ${text.variable}`}>
      <div className="tm-frame">
        <TimesNav />
        <TimesHero shot={assetUrl("site/hero.jpg")} />
        <TimesCta />
        <TimesConvey />
        <TimesStats />
        <TimesProps />
        <TimesFinder boards={PUBLIC_BOARDS} cities={PUBLIC_CITIES} />
        <TimesContact />
        <TimesFoot />
      </div>
    </div>
  );
}
