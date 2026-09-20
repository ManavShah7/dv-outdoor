"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { BoardStatus } from "@/lib/types";

/* ---------------------------------------------------------------- Button */
type Variant = "primary" | "secondary" | "plain";

export function Button({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<typeof motion.button> & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-control)]",
        "text-subhead font-[590] transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" &&
          "bg-accent text-accent-on hover:bg-accent-hover",
        variant === "secondary" &&
          "material-inset text-ink-0 ring-1 ring-white/[0.08] ring-inset hover:bg-white/[0.07]",
        variant === "plain" && "text-ink-300 hover:text-ink-0",
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------------------------------- Section header */
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-title3 font-[620] text-ink-0">{children}</h2>
  );
}

/* ------------------------------------------------------------ Nested card */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] material-inset p-5",
        "ring-1 ring-white/[0.07] ring-inset",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------- Label + value pair (read-only) */
export function Field({
  label,
  children,
  accent,
}: {
  label: string;
  children: ReactNode;
  accent?: "default" | "money" | "status";
}) {
  return (
    <div className="min-w-0">
      <div className="text-footnote text-ink-400">{label}</div>
      <div
        className={cn(
          "mt-1 text-body font-[590] text-ink-0",
          accent === "money" && "tabular-nums",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Status dot */
const STATUS_META: Record<BoardStatus, { label: string; color: string }> = {
  available:         { label: "Available",         color: "var(--color-available)" },
  booked:            { label: "Booked",            color: "var(--color-booked)" },
  under_maintenance: { label: "Under maintenance", color: "var(--color-maintenance)" },
  damaged:           { label: "Damaged",           color: "var(--color-damaged)" },
};

export function statusMeta(s: BoardStatus) {
  return STATUS_META[s];
}

export function StatusLabel({ status }: { status: BoardStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-2 text-body font-[590]" style={{ color: m.color }}>
      <span className="size-[7px] rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}
