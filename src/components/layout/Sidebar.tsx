"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Rows3, Upload, QrCode, Navigation } from "lucide-react";
import { motion } from "motion/react";
import { springSubtle } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/boards", label: "Boards", icon: Rows3, adminOnly: false },
  { href: "/field", label: "Field mode", icon: Navigation, adminOnly: false },
  { href: "/boards/import", label: "Import", icon: Upload, adminOnly: true },
  { href: "/qr/print", label: "QR stickers", icon: QrCode, adminOnly: true },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-60 flex-col gap-1 border-r border-border bg-surface px-3 py-5">
      <div className="mb-4 px-3">
        <span className="text-sm font-semibold tracking-tight text-foreground">DV Outdoor</span>
        <p className="text-xs text-muted">Board operations</p>
      </div>

      {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground",
              active && "text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                transition={springSubtle}
                className="absolute inset-0 rounded-lg bg-foreground/5"
              />
            )}
            <item.icon className="relative z-10 size-4" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
