import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition-shadow focus:border-accent/50 focus:ring-4 focus:ring-accent/12",
        className,
      )}
      {...props}
    />
  );
}
