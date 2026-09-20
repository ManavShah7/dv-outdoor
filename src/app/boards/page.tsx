import { PUBLIC_BOARDS, PUBLIC_CITIES } from "@/lib/publicBoards";
import { InventoryBrowser } from "@/components/site/InventoryBrowser";

export const metadata = {
  title: "Inventory — DV Outdoor",
  description: "Browse every hoarding, unipole and gantry DV Outdoor owns across Gujarat.",
};

export default async function PublicBoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string; city?: string }>;
}) {
  const { board, city } = await searchParams;
  return (
    <div>
      <InventoryBrowser
        boards={PUBLIC_BOARDS}
        cities={PUBLIC_CITIES}
        initialBoard={board ?? null}
        initialCity={city ?? null}
      />
    </div>
  );
}
