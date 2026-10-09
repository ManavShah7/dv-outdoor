import "./editorial.css";
import { text, display } from "@/components/times/fonts";
import { getPublicBoards } from "@/lib/boards.db";
import { getHotspots } from "@/lib/hotspots.db";
import { Landing, EdFoot } from "@/components/times/editorial";
import { EdContact } from "@/components/times/EdContact";

export const metadata = {
  title: "The Times Media — billboards across Saurashtra",
  description:
    "600+ billboards across Saurashtra, ours, maintained by us and rented directly to you. See every site on the map, in Street View, before you commit.",
};

/**
 * Read fresh: the live map on this page shows real availability, and a board
 * the office booked ten minutes ago must not still be green here.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [{ boards }, hotspots] = await Promise.all([getPublicBoards(), getHotspots()]);
  return (
    <div className={`ed ${text.variable} ${display.variable}`}>
      <Landing boards={boards} hotspots={hotspots} />
      <EdContact />
      <EdFoot />
    </div>
  );
}
