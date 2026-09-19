import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // No project connected yet — render pages as-is; each one shows its own
  // "connect Supabase" notice rather than gating behind a login that can't work.
  if (!isSupabaseConfigured()) {
    return <main className="min-h-full bg-background p-6">{children}</main>;
  }

  const session = await getCurrentProfile();
  if (!session) redirect("/login");

  const isAdmin = session.profile.role === "admin";

  return (
    <div className="flex h-full">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <TopBar profile={session.profile} />
        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
      {isAdmin && <ChatWidget />}
    </div>
  );
}
