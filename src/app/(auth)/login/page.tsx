import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ConnectSupabaseNotice } from "@/components/dashboard/ConnectSupabaseNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-6">
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
