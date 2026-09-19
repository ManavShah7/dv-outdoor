import { DatabaseZap } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ConnectSupabaseNotice() {
  return (
    <Card className="flex items-start gap-3.5 p-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <DatabaseZap className="size-4.5" />
      </div>
      <div>
        <p className="text-sm font-medium tracking-tight text-foreground">Connect Supabase to see live data</p>
        <p className="mt-1 text-sm text-muted">
          Create a Supabase project, run the migration in{" "}
          <code className="rounded bg-foreground/5 px-1 py-0.5 text-xs">supabase/migrations</code>, then
          copy <code className="rounded bg-foreground/5 px-1 py-0.5 text-xs">.env.example</code> to{" "}
          <code className="rounded bg-foreground/5 px-1 py-0.5 text-xs">.env.local</code> and fill in your
          project URL and anon key.
        </p>
      </div>
    </Card>
  );
}
