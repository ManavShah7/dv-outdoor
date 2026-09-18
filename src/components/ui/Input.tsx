import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted outline-none transition-shadow focus:border-accent/60 focus:ring-2 focus:ring-accent/15",
        className,
      )}
      {...props}
    />
  );
}
