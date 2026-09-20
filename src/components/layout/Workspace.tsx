"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Board } from "@/lib/types";
import { BOARDS } from "@/lib/mockBoards";
import { Sidebar, type NavId } from "@/components/layout/Sidebar";
import { SearchPanel, type QuickFilter } from "@/components/board/SearchPanel";
import { BoardInspector, ManageMenu } from "@/components/board/BoardInspector";
import { BoardMap } from "@/components/map/BoardMap";
import { AccentSwitcher } from "@/components/ui/AccentSwitcher";

function matches(b: Board, q: string, f: QuickFilter | null) {
  if (f) {
    if (f.kind === "status" && b.status !== f.value) return false;
    if (f.kind === "lighting" && b.lighting !== f.value) return false;
    if (f.kind === "city" && b.city !== f.value) return false;
  }
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    b.name.toLowerCase().includes(s) ||
    b.area.toLowerCase().includes(s) ||
    b.city.toLowerCase().includes(s) ||
    b.address.toLowerCase().includes(s) ||
    b.pincode.includes(s) ||
    b.code.toLowerCase().includes(s)
  );
}

export function Workspace() {
  const [nav, setNav] = useState<NavId>("search");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter | null>(null);
  const [selected, setSelected] = useState<Board | null>(null);
  const [managing, setManaging] = useState(false);

  const filtered = useMemo(
    () => BOARDS.filter((b) => matches(b, query, filter)),
    [query, filter],
  );

  const counts = useMemo(
    () => ({
      total: BOARDS.length,
      booked: BOARDS.filter((b) => b.status === "booked").length,
      available: BOARDS.filter((b) => b.status === "available").length,
      damaged: BOARDS.filter((b) => b.status === "damaged").length,
      underMaintenance: BOARDS.filter((b) => b.status === "under_maintenance").length,
    }),
    [],
  );

  function selectBoard(b: Board) {
    setSelected(b);
    setManaging(false);
  }

  const panel = selected ? "detail" : nav === "search" ? "search" : null;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar
        active={nav}
        onNavigate={(id) => {
          setNav(id);
          setSelected(null);
        }}
        counts={counts}
      />

      <AnimatePresence mode="wait" initial={false}>
        {panel && (
          <motion.div
            key={panel}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 427, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="h-full shrink-0 overflow-hidden border-l border-chrome-line/60"
          >
            {panel === "detail" && selected ? (
              <BoardInspector
                board={selected}
                onClose={() => setSelected(null)}
                onManage={() => setManaging(true)}
              />
            ) : (
              <SearchPanel
                query={query}
                onQuery={setQuery}
                active={filter}
                onToggle={(f) =>
                  setFilter((cur) =>
                    cur && cur.kind === f.kind && cur.value === f.value ? null : f,
                  )
                }
                results={filtered}
                onSelect={selectBoard}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-1">
        <BoardMap boards={filtered} selectedId={selected?.id} onSelect={selectBoard} />

        {managing && selected && (
          <ManageMenu board={selected} onDismiss={() => setManaging(false)} />
        )}

        {/* Floating count chip — chrome over the map, so it earns a material. */}
        <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-[var(--radius-pill)] material-regular specular-edge px-4 py-2">
          <span className="text-subhead font-[590] tabular-nums text-ink-0">
            {filtered.length.toLocaleString("en-IN")}
          </span>
          <span className="ml-1.5 text-subhead text-ink-300">
            {filtered.length === BOARDS.length ? "boards" : `of ${BOARDS.length}`}
          </span>
        </div>

        <AccentSwitcher />
      </div>
    </div>
  );
}
