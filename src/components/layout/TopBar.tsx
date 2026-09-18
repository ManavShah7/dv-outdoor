import { SignOutButton } from "@/components/layout/SignOutButton";
import type { Profile } from "@/lib/types/database";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
          <p className="text-xs text-muted capitalize">{profile.role.replace("_", " ")}</p>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
