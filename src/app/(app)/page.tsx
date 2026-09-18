import { Boxes, CircleCheck, CalendarCheck2, TriangleAlert, ShieldAlert } from "lucide-react";
import { getBoards } from "@/lib/supabase/boards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PERMIT_RENEWAL_WINDOW_DAYS } from "@/lib/boards";
import { daysUntil } from "@/lib/utils";
import { ConnectSupabaseNotice } from "@/components/dashboard/ConnectSupabaseNotice";
import { StatTile } from "@/components/dashboard/StatTile";
import { DashboardMap } from "@/components/dashboard/DashboardMap";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <ConnectSupabaseNotice />
      </div>
    );
  }

  const boards = await getBoards();

  const available = boards.filter((b) => b.status === "available").length;
  const booked = boards.filter((b) => b.status === "booked").length;
  const needsAttention = boards.filter(
    (b) => b.status === "under_maintenance" || b.status === "damaged",
  ).length;
  const permitsDue = boards.filter(
    (b) => b.permit_expiry_date && daysUntil(b.permit_expiry_date) <= PERMIT_RENEWAL_WINDOW_DAYS,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">{boards.length} boards across Gujarat</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Total boards" value={boards.length} icon={<Boxes className="size-4.5" />} />
        <StatTile label="Available" value={available} icon={<CircleCheck className="size-4.5" />} />
        <StatTile label="Booked" value={booked} icon={<CalendarCheck2 className="size-4.5" />} />
        <StatTile
          label="Needs attention"
          value={needsAttention}
          icon={<TriangleAlert className="size-4.5" />}
          tone="warning"
        />
        <StatTile
          label="Permits due"
          value={permitsDue}
          icon={<ShieldAlert className="size-4.5" />}
          tone="warning"
        />
      </div>

      <Card className="p-4">
        <DashboardMap boards={boards} />
      </Card>
    </div>
  );
}
