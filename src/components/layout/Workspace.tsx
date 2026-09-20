"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Board } from "@/lib/types";
import { BOARDS } from "@/lib/mockBoards";
import { Sidebar, type NavId } from "@/components/layout/Sidebar";
import { SearchPanel, type QuickFilter } from "@/components/board/SearchPanel";
import { BoardInspector, ManageMenu } from "@/components/board/BoardInspector";
import { BookingFlow, type BookingDraft } from "@/components/board/BookingFlow";
import { BoardMap } from "@/components/map/BoardMap";
import { AccentSwitcher } from "@/components/ui/AccentSwitcher";
import { Toast } from "@/components/ui/Toast";

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

type Mode = "idle" | "managing" | "booking";

export function Workspace() {
  const [boards, setBoards] = useState<Board[]>(BOARDS);
  const [nav, setNav] = useState<NavId>("search");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [toast, setToast] = useState<string | null>(null);

  const selected = useMemo(
    () => boards.find((b) => b.id === selectedId) ?? null,
    [boards, selectedId],
  );

  const filtered = useMemo(
    () => boards.filter((b) => matches(b, query, filter)),
    [boards, query, filter],
  );

  const counts = useMemo(
    () => ({
      total: boards.length,
      booked: boards.filter((b) => b.status === "booked").length,
      available: boards.filter((b) => b.status === "available").length,
      damaged: boards.filter((b) => b.status === "damaged").length,
      underMaintenance: boards.filter((b) => b.status === "under_maintenance").length,
    }),
    [boards],
  );

  /** Every company that has ever rented — the list the picker dedupes against. */
  const companies = useMemo(() => {
    const set = new Set<string>();
    for (const b of boards) if (b.rental) set.add(b.rental.company);
    return [...set].sort();
  }, [boards]);

  function selectBoard(b: Board) {
    setSelectedId(b.id);
    setMode("idle");
  }

  function confirmBooking(d: BookingDraft) {
    if (!selected) return;
    setBoards((prev) =>
      prev.map((b) =>
        b.id === selected.id
          ? {
              ...b,
              status: "booked",
              availableSince: undefined,
              rental: {
                company: d.company.trim(),
                rate: Number(d.rate),
                startDate: d.startDate,
                endDate: d.endDate,
                printedBy: d.printedBy === "client" ? "client" : "us",
                contactPerson: d.contactPerson.trim() || "—",
                phone: d.phone.trim() || "—",
              },
            }
          : b,
      ),
    );
    setMode("idle");
    setToast(`${selected.name} booked to ${d.company.trim()}`);
  }

  const panel: "detail" | "search" | "booking" | null =
    mode === "booking" && selected ? "booking"
    : selected ? "detail"
    : nav === "search" ? "search"
    : null;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar
        active={nav}
        onNavigate={(id) => {
          setNav(id);
          setSelectedId(null);
          setMode("idle");
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
            {panel === "booking" && selected ? (
              <BookingFlow
                board={selected}
                companies={companies}
                onCancel={() => setMode("idle")}
                onConfirm={confirmBooking}
              />
            ) : panel === "detail" && selected ? (
              <BoardInspector
                board={selected}
                onClose={() => setSelectedId(null)}
                onManage={() => setMode("managing")}
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

        {mode === "managing" && selected && (
          <ManageMenu
            board={selected}
            onDismiss={() => setMode("idle")}
            onBook={() => setMode("booking")}
            onRequestMaintenance={() => {
              setMode("idle");
              setToast("Maintenance triage comes next.");
            }}
          />
        )}

        {/* Floating count chip — chrome over the map, so it earns a material. */}
        <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-[var(--radius-pill)] material-regular specular-edge px-4 py-2">
          <span className="text-subhead font-[590] tabular-nums text-ink-0">
            {filtered.length.toLocaleString("en-IN")}
          </span>
          <span className="ml-1.5 text-subhead text-ink-300">
            {filtered.length === boards.length ? "boards" : `of ${boards.length}`}
          </span>
        </div>

        <AccentSwitcher />
        <Toast message={toast} onDone={() => setToast(null)} />
      </div>
    </div>
  );
}
