import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { FieldHome } from "@/components/field/FieldHome";

export default async function FieldHomePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=%2Ffield");
  if (profile.status !== "approved") redirect("/login");
  return <FieldHome name={profile.full_name ?? profile.email} />;
}
