import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ConnectSupabaseNotice } from "@/components/dashboard/ConnectSupabaseNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <div
      className="flex min-h-full items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse 60% 45% at 50% 0%, color-mix(in srgb, var(--accent) 6%, transparent), transparent 70%), var(--background)",
      }}
    >
      {isSupabaseConfigured() ? (
        <Suspense>
          <LoginForm />
        </Suspense>
      ) : (
        <div className="w-full max-w-sm">
          <ConnectSupabaseNotice />
        </div>
      )}
    </div>
  );
}
