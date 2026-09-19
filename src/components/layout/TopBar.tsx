import { SignOutButton } from "@/components/layout/SignOutButton";
import type { Profile } from "@/lib/types/database";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/70 bg-surface/80 px-6 backdrop-blur-md">
      <div />
      <div className="flex items-center gap-3.5">
        <div className="text-right">
          <p className="text-sm font-medium tracking-tight text-foreground">{profile.full_name}</p>
          <p className="text-xs text-muted capitalize">{profile.role.replace("_", " ")}</p>
        </div>
        <div className="flex size-8 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
          {profile.full_name.slice(0, 1).toUpperCase()}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
