import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}
