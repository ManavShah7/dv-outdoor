"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <Card className="flex items-center justify-between p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
        <div>
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <p
            className={cn(
              "mt-1.5 text-[26px] font-semibold tracking-tight tabular-nums",
              tone === "warning" && "text-status-permit-due",
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent",
            tone === "warning" && "bg-status-permit-due/10 text-status-permit-due",
          )}
        >
          {icon}
        </div>
      </Card>
    </motion.div>
  );
}
