import { STATUS_META } from "@/lib/boards";
import type { BoardStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: BoardStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface px-2.5 py-1 text-xs font-medium tracking-tight text-foreground",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}
