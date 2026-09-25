import { PUBLIC_BOARDS, PUBLIC_CITIES } from "@/lib/publicBoards";
import { text } from "@/components/times/fonts";
import { SiteHeader } from "@/components/site/SiteChrome";
import { InventoryBrowser } from "@/components/site/InventoryBrowser";

export const metadata = {
  title: "Every site — The Times Media",
  description: "Browse every hoarding, unipole and gantry The Times Media owns across Saurashtra.",
};

export default async function PublicBoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string; city?: string }>;
}) {
  const { board, city } = await searchParams;
  return (
    <div className={`tmui ${text.variable}`}>
      <SiteHeader />
      <InventoryBrowser
        boards={PUBLIC_BOARDS}
        cities={PUBLIC_CITIES}
        initialBoard={board ?? null}
        initialCity={city ?? null}
      />
    </div>
  );
}
