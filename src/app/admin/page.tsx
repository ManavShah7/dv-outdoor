import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { getBoards } from "@/lib/boards.db";
import { getEnquiries } from "@/lib/enquiries.db";
import { getHotspots } from "@/lib/hotspots.db";
import { Workspace } from "@/components/layout/Workspace";

/** The office should open on what is true right now, not on a cached copy. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=%2Fadmin");
  // A field agent has no business in the admin shell.
  if (profile.role !== "admin" || profile.status !== "approved") redirect("/field");

  const [boards, enquiries, hotspots] = await Promise.all([
    getBoards(), getEnquiries(), getHotspots(),
  ]);
  return (
    <Workspace
      adminName={profile.full_name ?? profile.email}
      initialBoards={boards}
      enquiries={enquiries}
      hotspots={hotspots}
    />
  );
}
