import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { Workspace } from "@/components/layout/Workspace";

export default async function Page() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // A field agent has no business in the admin shell — send them to the
  // surface they actually use.
  if (profile.role !== "admin" || profile.status !== "approved") redirect("/field");
  return <Workspace adminName={profile.full_name ?? profile.email} />;
}
