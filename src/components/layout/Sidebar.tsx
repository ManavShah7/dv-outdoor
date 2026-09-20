"use client";

import { Search, FolderClosed, Wrench, BarChart3, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "search",      label: "Search",      icon: Search },
  { id: "boards",      label: "Boards",      icon: FolderClosed },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "analytics",   label: "Analytics",   icon: BarChart3 },
  { id: "settings",    label: "Settings",    icon: Settings },
] as const;

export type NavId = (typeof NAV)[number]["id"];

type Counts = {
  total: number;
  booked: number;
  available: number;
  damaged: number;
  underMaintenance: number;
};

const BREAKDOWN = [
  { key: "booked" as const,           label: "Booked",      color: "var(--color-booked)" },
  { key: "available" as const,        label: "Available",   color: "var(--color-available)" },
  { key: "damaged" as const,          label: "Damaged",     color: "var(--color-damaged)" },
  { key: "underMaintenance" as const, label: "Maintenance", color: "var(--color-maintenance)" },
];

export function Sidebar({
  active,
  onNavigate,
  counts,
  adminName,
}: {
  active: NavId;
  onNavigate: (id: NavId) => void;
  counts: Counts;
  adminName?: string;
}) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-[328px] shrink-0 flex-col material-thick border-r border-white/[0.06]">
      {/* wordmark */}
      <div className="flex h-[108px] items-center border-b border-white/[0.07] px-10">
        <span className="text-title3 font-[680] tracking-[-0.02em] text-ink-0">
          DV Outdoor
        </span>
      </div>

      {/* navigation */}
      <nav className="border-b border-white/[0.07] py-4">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "group relative flex h-[52px] w-full items-center gap-[22px] px-10 text-left",
                "transition-colors duration-150",
                isActive ? "text-ink-0" : "text-ink-300 hover:text-ink-0",
              )}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <Icon
                className="size-[22px] shrink-0"
                strokeWidth={isActive ? 2.1 : 1.8}
                style={isActive ? { color: "var(--accent)" } : undefined}
              />
              <span className="text-body font-[520]">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* live counts — one block, always fully visible */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="rounded-[var(--radius-card)] material-inset p-5 ring-1 ring-white/[0.07] ring-inset">
          <div className="text-caption2 uppercase text-ink-500">Total boards</div>
          <div className="mt-1 text-display font-[680] tabular-nums text-ink-0">
            {counts.total.toLocaleString("en-IN")}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-white/[0.07] pt-4">
            {BREAKDOWN.map((b) => (
              <div key={b.key} className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ background: b.color }} />
                <span className="flex-1 text-footnote text-ink-300">{b.label}</span>
                <span className="text-footnote font-[620] tabular-nums" style={{ color: b.color }}>
                  {counts[b.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.07] px-6 py-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
        >
          <LogOut className="size-[18px] shrink-0 text-ink-500" strokeWidth={2} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-footnote font-[590] text-ink-200">
              {adminName ?? "Signed in"}
            </span>
            <span className="block text-caption text-ink-600">Sign out</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
