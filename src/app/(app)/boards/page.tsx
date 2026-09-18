import { getBoards } from "@/lib/supabase/boards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConnectSupabaseNotice } from "@/components/dashboard/ConnectSupabaseNotice";
import { BoardsTable } from "@/components/boards/BoardsTable";

export default async function BoardsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-foreground">Boards</h1>
        <ConnectSupabaseNotice />
      </div>
    );
  }

  const boards = await getBoards();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Boards</h1>
      <BoardsTable boards={boards} />
    </div>
  );
}
