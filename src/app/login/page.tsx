import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const profile = await getProfile();
  if (profile?.status === "approved") {
    redirect(next ?? (profile.role === "admin" ? "/" : "/field"));
  }
  return <LoginForm next={next} />;
}
