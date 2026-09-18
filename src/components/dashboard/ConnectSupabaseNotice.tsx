import { DatabaseZap } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ConnectSupabaseNotice() {
  return (
    <Card className="flex items-start gap-3 p-5">
      <DatabaseZap className="mt-0.5 size-5 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-medium text-foreground">Connect Supabase to see live data</p>
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
