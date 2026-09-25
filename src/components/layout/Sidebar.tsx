"use client";

import { Search, FolderClosed, Inbox, Wrench, BarChart3, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "search",      label: "Search",      icon: Search },
  { id: "boards",      label: "Boards",      icon: FolderClosed },
  { id: "enquiries",   label: "Enquiries",   icon: Inbox },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "analytics",   label: "Analytics",   icon: BarChart3 },
  { id: "settings",    label: "Settings",    icon: Settings },
] as const;

export type NavId = (typeof NAV)[number]["id"];

type Counts = {
  /** leads nobody has picked up yet — the one number worth a badge */
  newEnquiries: number;
  total: number;
  booked: number;
  available: number;
  damaged: number;
  underMaintenance: number;
};

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] material-inset px-5 py-4 ring-1 ring-white/[0.07] ring-inset">
      <div className="text-subhead text-ink-300">{label}</div>
      <div
        className="mt-1 text-display font-[680] tabular-nums"
        style={{ color: color ?? "var(--color-ink-0)" }}
      >
        {value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

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
          The Times Media
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
              {id === "enquiries" && counts.newEnquiries > 0 && (
                <span
                  className="ml-auto mr-1 grid min-w-5 place-items-center rounded-full px-1.5 text-caption font-[700] tabular-nums"
                  style={{ background: "var(--color-sev-red)", color: "#0b0e10" }}
                >
                  {counts.newEnquiries}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* live counts */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-6">
        <StatCard label="Total Boards"     value={counts.total} />
        <StatCard label="Booked Boards"    value={counts.booked}    color="var(--color-booked)" />
        <StatCard label="Available Boards" value={counts.available} color="var(--color-available)" />

        <div className="rounded-[var(--radius-card)] material-inset px-5 py-4 ring-1 ring-white/[0.07] ring-inset">
          <div className="text-subhead text-ink-300">Maintenance</div>
          <div className="mt-3 flex gap-8">
            <div>
              <div className="text-footnote text-ink-400">Damaged</div>
              <div
                className="text-title1 font-[680] tabular-nums"
                style={{ color: "var(--color-damaged)" }}
              >
                {counts.damaged}
              </div>
            </div>
            <div>
              <div className="text-footnote text-ink-400">Under maintenance</div>
              <div
                className="text-title1 font-[680] tabular-nums"
                style={{ color: "var(--color-maintenance)" }}
              >
                {counts.underMaintenance}
              </div>
            </div>
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
