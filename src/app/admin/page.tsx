import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { Workspace } from "@/components/layout/Workspace";

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=%2Fadmin");
  // A field agent has no business in the admin shell.
  if (profile.role !== "admin" || profile.status !== "approved") redirect("/field");
  return <Workspace adminName={profile.full_name ?? profile.email} />;
}
