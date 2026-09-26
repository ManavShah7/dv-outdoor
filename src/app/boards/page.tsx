import { getPublicBoards } from "@/lib/boards.db";
import { getHotspots } from "@/lib/hotspots.db";
import { text } from "@/components/times/fonts";
import { SiteHeader } from "@/components/site/SiteChrome";
import { InventoryBrowser } from "@/components/site/InventoryBrowser";

export const metadata = {
  title: "Every site — The Times Media",
  description: "Browse every hoarding, unipole and gantry The Times Media owns across Saurashtra.",
};

/**
 * Read fresh on every request. A board that the office marked booked ten
 * minutes ago must not still be advertised as free — that is a phone call
 * about a site someone cannot have.
 */
export const dynamic = "force-dynamic";

export default async function PublicBoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string; city?: string }>;
}) {
  const { board, city } = await searchParams;
  const [{ boards, cities }, hotspots] = await Promise.all([getPublicBoards(), getHotspots()]);
  return (
    <div className={`tmui ${text.variable}`}>
      <SiteHeader />
      <InventoryBrowser
        boards={boards}
        cities={cities}
        initialBoard={board ?? null}
        initialCity={city ?? null}
        hotspots={hotspots}
      />
    </div>
  );
}
