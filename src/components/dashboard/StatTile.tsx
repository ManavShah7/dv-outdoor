"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "warning";
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className={cn("mt-1 text-2xl font-semibold tracking-tight", tone === "warning" && "text-status-permit-due")}>
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full bg-accent/10 text-accent",
            tone === "warning" && "bg-status-permit-due/10 text-status-permit-due",
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </Card>
    </motion.div>
  );
}
