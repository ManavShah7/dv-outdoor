"use client";

import { useMemo, useState } from "react";
import { STATUS_META } from "@/lib/boards";
import type { Board, BoardStatus } from "@/lib/types/database";
import { BoardMap } from "@/components/dashboard/BoardMap";
import { cn } from "@/lib/utils";

const ALL_STATUSES = Object.keys(STATUS_META) as BoardStatus[];

export function DashboardMap({ boards }: { boards: Board[] }) {
  const [activeStatuses, setActiveStatuses] = useState<Set<BoardStatus>>(new Set(ALL_STATUSES));

  const filtered = useMemo(
    () => boards.filter((board) => activeStatuses.has(board.status)),
    [boards, activeStatuses],
  );

  function toggle(status: BoardStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next.size === 0 ? new Set(ALL_STATUSES) : next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const active = activeStatuses.has(status);
          return (
            <button
              key={status}
              onClick={() => toggle(status)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-transparent bg-foreground/5 text-foreground"
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
      <BoardMap boards={filtered} />
    </div>
  );
}
