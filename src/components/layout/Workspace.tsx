"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Board } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sidebar, type NavId } from "@/components/layout/Sidebar";
import { SearchPanel, type QuickFilter } from "@/components/board/SearchPanel";
import { BoardInspector, ManageMenu } from "@/components/board/BoardInspector";
import { BookingFlow, type BookingDraft } from "@/components/board/BookingFlow";
import { BoardMap } from "@/components/map/BoardMap";
import { MapsProvider } from "@/components/map/MapsProvider";
import { MaintenanceDetail } from "@/components/maintenance/MaintenancePanel";
import { MaintenanceView } from "@/components/maintenance/MaintenanceView";
import { BoardsView } from "@/components/boards/BoardsView";
import { BoardCreate } from "@/components/boards/BoardCreate";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { MAINTENANCE, type MaintenanceRequest } from "@/lib/mockMaintenance";
import { Toast } from "@/components/ui/Toast";
import { ChatWidget } from "@/components/chat/ChatWidget";
import type { AgentAction } from "@/lib/agentTools";

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

export function Workspace({
  adminName, initialBoards,
}: {
  adminName?: string; initialBoards: Board[];
}) {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [nav, setNav] = useState<NavId>("search");
  const [searchOpen, setSearchOpen] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>(MAINTENANCE);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Write it down, then re-read.
   *
   * The optimistic update stays — the office should not wait on a round trip
   * to see its own click — but the server is the thing that decides. On
   * failure the refresh puts the real state back and says why, which matters
   * most for double-booking: the partial unique index, not this component, is
   * what stops two clients being sold the same board.
   */
  async function persist(body: Record<string, unknown>, failure: string) {
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setToast(d?.error ?? failure);
      }
    } catch {
      setToast(failure);
    } finally {
      router.refresh();
    }
  }

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

  function applyAgentActions(actions: AgentAction[]) {
    let note: string | null = null;
    for (const a of actions) {
      if (a.kind === "focus_board") {
        const b = boards.find((x) => x.code === a.code);
        if (b) { setSelectedId(b.id); setNav("search"); setSearchOpen(true); }
      } else if (a.kind === "set_status") {
        setBoards((prev) =>
          prev.map((b) => (b.code === a.code ? { ...b, status: a.status } : b)),
        );
        void persist({ code: a.code, action: "set_status", status: a.status },
                     `Could not set ${a.code} to ${a.status}.`);
        note = `${a.code} set to ${a.status.replace(/_/g, " ")}`;
      } else if (a.kind === "book_board") {
        setBoards((prev) =>
          prev.map((b) =>
            b.code === a.code
              ? {
                  ...b,
                  status: "booked",
                  availableSince: undefined,
                  rental: {
                    company: a.company,
                    rate: a.rate,
                    startDate: a.startDate,
                    endDate: a.endDate,
                    printedBy: a.printedBy,
                    contactPerson: "—",
                    phone: "—",
                  },
                }
              : b,
          ),
        );
        void persist(
          { code: a.code, action: "book", company: a.company, rate: a.rate,
            startDate: a.startDate, endDate: a.endDate, printedBy: a.printedBy },
          `Could not book ${a.code}.`,
        );
        note = `${a.code} booked to ${a.company}`;
      }
    }
    if (note) setToast(note);
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
    void persist(
      { code: selected.code, action: "book", company: d.company.trim(), rate: Number(d.rate),
        startDate: d.startDate, endDate: d.endDate, printedBy: d.printedBy },
      `Could not book ${selected.name}.`,
    );
    setMode("idle");
    setToast(`${selected.name} booked to ${d.company.trim()}`);
  }

  function releaseBoard() {
    if (!selected) return;
    setBoards((prev) =>
      prev.map((b) =>
        b.id === selected.id
          ? { ...b, status: "available", rental: undefined, availableSince: new Date().toISOString().slice(0, 10) }
          : b,
      ),
    );
    void persist({ code: selected.code, action: "release" }, `Could not free ${selected.name}.`);
    setMode("idle");
    setToast(`${selected.name} is free again`);
  }

  const openRequest = useMemo(
    () => requests.find((r) => r.id === openRequestId) ?? null,
    [requests, openRequestId],
  );

  function openMaintenance(r: MaintenanceRequest) {
    setOpenRequestId(r.id);
  }

  function rateAssessment(v: "up" | "down") {
    if (!openRequest) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === openRequest.id ? { ...r, adminFeedback: v } : r)),
    );
  }

  function startWork() {
    if (!openRequest) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === openRequest.id ? { ...r, status: "in_progress" } : r)),
    );
    setBoards((prev) =>
      prev.map((b) =>
        b.id === openRequest.boardId ? { ...b, status: "under_maintenance" } : b,
      ),
    );
    const b = boards.find((x) => x.id === openRequest.boardId);
    if (b) void persist({ code: b.code, action: "set_status", status: "under_maintenance" },
                        `Could not set ${b.code} to under maintenance.`);
    setToast(`${b?.name ?? "Board"} set to under maintenance`);
  }

  const onMaintenance = nav === "maintenance";
  const onBoards = nav === "boards";
  const onAnalytics = nav === "analytics";
  const onSettings = nav === "settings";
  const fullScreen = onMaintenance || onBoards || onAnalytics || onSettings;

  const existingCodes = useMemo(
    () => new Set(boards.map((b) => b.code.toUpperCase())),
    [boards],
  );

  const panel: "detail" | "search" | "booking" | null =
    fullScreen ? null
    : mode === "booking" && selected ? "booking"
    : selected ? "detail"
    : nav === "search" && searchOpen ? "search"
    : null;

  return (
    <MapsProvider>
    <div className="relative h-dvh w-full overflow-hidden">
      {/* canvas */}
      <div className="absolute inset-0">
        <BoardMap
          boards={filtered}
          selectedId={selected?.id}
          onSelect={selectBoard}
          insetLeft={panel ? 328 + 427 + 24 : 328 + 24}
        />
      </div>

      {/* floating chrome */}
      <div className="pointer-events-none absolute inset-0 flex">
      <div className="pointer-events-auto">
      <Sidebar
        active={nav}
        onNavigate={(id) => {
          setNav(id);
          setSelectedId(null);
          setMode("idle");
          if (id === "search") setSearchOpen(true);
          if (id === "maintenance") setOpenRequestId(null);
          if (id !== "boards") setCreating(false);
        }}
        counts={counts}
        adminName={adminName}
      />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {panel && (
          <motion.div
            key={panel}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 427, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto h-full shrink-0 overflow-hidden"
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
                onBook={() => setMode("booking")}
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
                onClearFilter={() => setFilter(null)}
                results={filtered}
                onSelect={selectBoard}
                onClose={() => setSearchOpen(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {onMaintenance && (
        <div className="pointer-events-auto relative min-w-0 flex-1">
          <MaintenanceView requests={requests} boards={boards} onOpen={openMaintenance} />

          {openRequest && (
            <>
              <button
                aria-label="Close details"
                onClick={() => setOpenRequestId(null)}
                className="absolute inset-0 z-20 bg-black/45"
              />
              <motion.div
                initial={{ x: 32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-y-0 right-0 z-30 w-[480px] border-l border-white/[0.08] shadow-[var(--shadow-pop)]"
              >
                <MaintenanceDetail
                  request={openRequest}
                  board={boards.find((b) => b.id === openRequest.boardId)}
                  onBack={() => setOpenRequestId(null)}
                  onFeedback={rateAssessment}
                  onStartWork={startWork}
                />
              </motion.div>
            </>
          )}

          <Toast message={toast} onDone={() => setToast(null)} />
        </div>
      )}

      {onSettings && (
        <div className="pointer-events-auto relative min-w-0 flex-1">
          <TeamSettings meEmail={adminName ?? ""} />
        </div>
      )}

      {onAnalytics && (
        <div className="pointer-events-auto relative min-w-0 flex-1">
          <AnalyticsView boards={boards} />
        </div>
      )}

      {onBoards && (
        <div className="pointer-events-auto relative min-w-0 flex-1">
          <BoardsView
            boards={boards}
            onOpen={(b) => {
              setSelectedId(b.id);
              setNav("search");
              setSearchOpen(true);
            }}
            onCreate={() => setCreating(true)}
          />

          {creating && (
            <BoardCreate
              existingCodes={existingCodes}
              onCancel={() => setCreating(false)}
              onCreate={(b) => {
                setBoards((prev) => [b, ...prev]);
                setCreating(false);
                setToast(`${b.name} created — QR ready to print`);
              }}
            />
          )}

          <Toast message={toast} onDone={() => setToast(null)} />
        </div>
      )}

      <div className={cn("pointer-events-none relative min-w-0 flex-1", fullScreen && "hidden")}>
        {mode === "managing" && selected && (
          <ManageMenu
            board={selected}
            onDismiss={() => setMode("idle")}
            onBook={() => setMode("booking")}
            onRelease={() => releaseBoard()}
            onRequestMaintenance={() => {
              setMode("idle");
              setNav("maintenance");
              setOpenRequestId(null);
            }}
          />
        )}

        <ChatWidget onActions={applyAgentActions} />
        <Toast message={toast} onDone={() => setToast(null)} />
      </div>
      </div>
    </div>
    </MapsProvider>
  );
}
