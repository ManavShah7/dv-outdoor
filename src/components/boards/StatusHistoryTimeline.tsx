import { STATUS_META } from "@/lib/boards";
import type { BoardStatusHistoryEntry } from "@/lib/types/database";

export function StatusHistoryTimeline({ entries }: { entries: BoardStatusHistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No status changes logged yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <span
            className="mt-1.5 size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_META[entry.new_status].color }}
          />
          <div>
            <p className="text-sm tracking-tight text-foreground">
              Marked <span className="font-medium">{STATUS_META[entry.new_status].label}</span>
              {entry.old_status && (
                <span className="text-muted"> (was {STATUS_META[entry.old_status].label})</span>
              )}
            </p>
            {entry.note && <p className="mt-0.5 text-sm text-muted">{entry.note}</p>}
            <p className="mt-0.5 text-xs text-muted">
              {new Date(entry.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
