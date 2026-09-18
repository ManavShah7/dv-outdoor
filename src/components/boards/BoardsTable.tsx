"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { STATUS_META, BOARD_TYPE_LABELS } from "@/lib/boards";
import type { Board, BoardStatus } from "@/lib/types/database";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermitBadge } from "@/components/ui/PermitBadge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function BoardsTable({ boards }: { boards: Board[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BoardStatus | "all">("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const cities = useMemo(() => Array.from(new Set(boards.map((b) => b.city))).sort(), [boards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boards.filter((board) => {
      if (statusFilter !== "all" && board.status !== statusFilter) return false;
      if (cityFilter !== "all" && board.city !== cityFilter) return false;
      if (q && !board.code.toLowerCase().includes(q) && !board.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [boards, query, statusFilter, cityFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name"
            className="pl-9"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent/60"
        >
          <option value="all">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BoardStatus | "all")}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent/60"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <option key={status} value={status}>
              {meta.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-muted">{filtered.length} of {boards.length} boards</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Permit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((board, i) => (
              <tr
                key={board.id}
                className={cn("border-b border-border last:border-0 hover:bg-foreground/[0.02]", i % 2 === 1 && "bg-foreground/[0.01]")}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted">{board.code}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/boards/${board.id}`} className="hover:text-accent">
                    {board.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{board.city}</td>
                <td className="px-4 py-3 text-muted">{BOARD_TYPE_LABELS[board.board_type]}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={board.status} />
                </td>
                <td className="px-4 py-3">
                  <PermitBadge permitExpiryDate={board.permit_expiry_date} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  No boards match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
