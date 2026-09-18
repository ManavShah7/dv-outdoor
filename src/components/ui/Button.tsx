"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary: "bg-surface text-foreground border border-border hover:border-foreground/25",
  ghost: "text-foreground hover:bg-foreground/5",
  danger: "bg-status-damaged text-white hover:bg-status-damaged/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof motion.button> & { variant?: Variant; size?: Size }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
