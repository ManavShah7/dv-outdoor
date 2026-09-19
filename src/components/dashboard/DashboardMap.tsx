"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Boxes, CircleCheck, CalendarCheck2, TriangleAlert, ShieldAlert } from "lucide-react";
import { STATUS_META, PERMIT_RENEWAL_WINDOW_DAYS } from "@/lib/boards";
import { daysUntil } from "@/lib/utils";
import type { Board, BoardStatus } from "@/lib/types/database";
import { BoardMap } from "@/components/dashboard/BoardMap";
import { cn } from "@/lib/utils";

const ALL_STATUSES = Object.keys(STATUS_META) as BoardStatus[];

function StatMini({
  label,
  value,
  icon,
  warn,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-foreground/[0.035] px-2.5 py-2">
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          warn ? "bg-status-permit-due/10 text-status-permit-due" : "bg-accent/10 text-accent",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium leading-none text-muted">{label}</p>
        <p className="text-sm font-semibold leading-tight tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export function DashboardMap({ boards }: { boards: Board[] }) {
  const [activeStatuses, setActiveStatuses] = useState<Set<BoardStatus>>(new Set(ALL_STATUSES));

  const filtered = useMemo(
    () => boards.filter((board) => activeStatuses.has(board.status)),
    [boards, activeStatuses],
  );

  const available = boards.filter((b) => b.status === "available").length;
  const booked = boards.filter((b) => b.status === "booked").length;
  const needsAttention = boards.filter(
    (b) => b.status === "under_maintenance" || b.status === "damaged",
  ).length;
  const permitsDue = boards.filter(
    (b) => b.permit_expiry_date && daysUntil(b.permit_expiry_date) <= PERMIT_RENEWAL_WINDOW_DAYS,
  ).length;

  function toggle(status: BoardStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next.size === 0 ? new Set(ALL_STATUSES) : next;
    });
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BoardMap boards={filtered} className="absolute inset-0 h-full w-full" />

      <div className="absolute left-5 top-5 z-10 flex w-[336px] flex-col gap-4 rounded-[28px] border border-border/60 bg-surface/85 p-5 shadow-[var(--shadow-float)] backdrop-blur-xl">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-foreground">Dashboard</p>
          <p className="text-xs text-muted">{boards.length} boards across Gujarat</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatMini label="Total boards" value={boards.length} icon={<Boxes className="size-3.5" />} />
          <StatMini label="Available" value={available} icon={<CircleCheck className="size-3.5" />} />
          <StatMini label="Booked" value={booked} icon={<CalendarCheck2 className="size-3.5" />} />
          <StatMini
            label="Attention"
            value={needsAttention}
            icon={<TriangleAlert className="size-3.5" />}
            warn
          />
          <StatMini label="Permits due" value={permitsDue} icon={<ShieldAlert className="size-3.5" />} warn />
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3.5">
          {ALL_STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const active = activeStatuses.has(status);
            return (
              <button
                key={status}
                onClick={() => toggle(status)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium tracking-tight transition-[background-color,color,border-color] active:scale-95",
                  active
                    ? "border-transparent bg-foreground/[0.06] text-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: meta.color, opacity: active ? 1 : 0.35 }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
