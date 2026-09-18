import { AlertTriangle } from "lucide-react";
import { PERMIT_RENEWAL_WINDOW_DAYS } from "@/lib/boards";
import { cn, daysUntil } from "@/lib/utils";

export function PermitBadge({
  permitExpiryDate,
  className,
}: {
  permitExpiryDate: string | null;
  className?: string;
}) {
  if (!permitExpiryDate) return null;

  const days = daysUntil(permitExpiryDate);
  if (days > PERMIT_RENEWAL_WINDOW_DAYS) return null;

  const label = days < 0 ? "Permit expired" : days === 0 ? "Permit expires today" : `Renewal due in ${days}d`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        days < 0
          ? "border-status-damaged/30 bg-status-damaged/10 text-status-damaged"
          : "border-status-permit-due/30 bg-status-permit-due/10 text-status-permit-due",
        className,
      )}
    >
      <AlertTriangle className="size-3.5" />
      {label}
    </span>
  );
}
