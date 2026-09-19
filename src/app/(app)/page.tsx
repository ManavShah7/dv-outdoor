import { getBoards } from "@/lib/supabase/boards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ConnectSupabaseNotice } from "@/components/dashboard/ConnectSupabaseNotice";
import { DashboardMap } from "@/components/dashboard/DashboardMap";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">Dashboard</h1>
        <ConnectSupabaseNotice />
      </div>
    );
  }

  const boards = await getBoards();

  return <DashboardMap boards={boards} />;
}
