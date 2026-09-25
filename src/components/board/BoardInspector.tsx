"use client";

import { AnimatePresence, motion } from "motion/react";
import { ImageOff, X } from "lucide-react";
import { useState } from "react";
import { StreetView } from "@/components/map/StreetView";
import type { Board } from "@/lib/types";
import { inr, fullDate, daysUntil, cn } from "@/lib/utils";
import { Button, Card, Field, SectionHeader, StatusLabel } from "@/components/ui/Primitives";
import { BoardQr } from "@/components/boards/BoardQr";
import { boardPhotoUrl } from "@/lib/assets";

function Visual({ code, lat, lng }: { code: string; lat: number; lng: number }) {
  const [view, setView] = useState<"street" | "photo">("street");
  const [noPhoto, setNoPhoto] = useState(false);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      {view === "street" ? (
        <StreetView lat={lat} lng={lng} className="absolute inset-0" />
      ) : noPhoto ? (
        <div className="flex size-full items-center justify-center material-inset">
          <ImageOff className="size-7 text-ink-600" strokeWidth={1.5} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote asset from Supabase Storage
        <img
          src={boardPhotoUrl(code)}
          alt=""
          onError={() => setNoPhoto(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-[var(--radius-pill)] material-thick p-1">
        {(["street", "photo"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-caption font-[590] transition-colors",
              view === v ? "bg-white/15 text-ink-0" : "text-ink-400 hover:text-ink-100",
            )}
          >
            {v === "street" ? "Street view" : "Photo"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BoardInspector({
  board,
  onClose,
  onManage,
  onBook,
}: {
  board: Board;
  onClose: () => void;
  onManage: () => void;
  onBook: () => void;
}) {
  const remaining = board.rental ? daysUntil(board.rental.endDate) : null;

  return (
    <div className="flex h-full w-[427px] shrink-0 flex-col overflow-y-auto material-thick border-r border-white/[0.06]">
      <div className="relative">
        <Visual code={board.code} lat={board.lat} lng={board.lng} />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full material-thick text-ink-200 transition-colors hover:text-ink-0"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      {/* identity */}
      <div className="border-b border-white/[0.07] px-8 py-7">
        <h1 className="text-title2 font-[680] text-ink-0">{board.name}</h1>
        <p className="mt-2 text-body text-ink-300">{board.address}</p>
        <p className="mt-3 text-footnote tabular-nums text-ink-500">
          {board.lat.toFixed(6)}, {board.lng.toFixed(6)}
        </p>
      </div>

      {/* availability */}
      <section className="border-b border-white/[0.07] px-8 py-7">
        <SectionHeader>Availability</SectionHeader>
        <Card className="mt-4">
          {board.rental ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Status"><StatusLabel status={board.status} /></Field>
                <Field label="Client">{board.rental.company}</Field>
              </div>
              <div>
                <div className="text-footnote text-ink-400">Lease period</div>
                <div className="mt-1 text-body font-[590] tabular-nums text-ink-0">
                  {fullDate(board.rental.startDate)} — {fullDate(board.rental.endDate)}
                </div>
                {remaining !== null && (
                  <div
                    className={cn("mt-1 text-footnote tabular-nums")}
                    style={{ color: remaining <= 30 ? "var(--color-maintenance)" : "var(--color-ink-500)" }}
                  >
                    {remaining > 0 ? `${remaining} days to go` : "Lease ended"}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rent" accent="money">{inr(board.rental.rate)}</Field>
                <Field label="Printer">
                  {board.rental.printedBy === "us" ? "DV Outdoor" : "Client"}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Person to contact">{board.rental.contactPerson}</Field>
                <Field label="Phone">{board.rental.phone}</Field>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status"><StatusLabel status={board.status} /></Field>
              {board.availableSince && (
                <Field label="Available since">{fullDate(board.availableSince)}</Field>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* spec */}
      <section className="px-8 py-7">
        <SectionHeader>Board details</SectionHeader>
        <Card className="mt-4 grid grid-cols-3 gap-4">
          <Field label="Size">
            <span className="capitalize">{board.sizeCategory}</span>
            <span className="ml-1 text-footnote font-normal tabular-nums text-ink-400">
              {board.widthFt}×{board.heightFt}
            </span>
          </Field>
          <Field label="Lighting">
            <span className="capitalize">
              {board.lighting === "none" ? "Non-lit" : board.lighting}
            </span>
          </Field>
          <Field label="Asking rate" accent="money">{inr(board.askingRate)}</Field>
        </Card>
      </section>

      {/* QR — the sticker that puts the field crew straight onto this board. */}
      <section className="border-t border-white/[0.07] px-8 py-7">
        <SectionHeader>Field QR</SectionHeader>
        <Card className="mt-4">
          <BoardQr board={board} />
        </Card>
      </section>

      {/* Pinned: the primary action should never require scrolling to find. */}
      <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-white/[0.07] material-thick px-8 py-5">
        {board.status !== "booked" && (
          <Button variant="primary" onClick={onBook}>Book this board</Button>
        )}
        <Button variant="secondary" onClick={onManage} className={board.status !== "booked" ? "w-auto shrink-0 px-5" : undefined}>
          {board.status !== "booked" ? "More" : "Manage board"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Manage popover — anchored over the map, exactly as in the Figma frame.     */
/* This is chrome floating over content, so it earns a material.              */
export function ManageMenu({
  board,
  onDismiss,
  onBook,
  onRelease,
  onRequestMaintenance,
}: {
  board: Board;
  onDismiss: () => void;
  onBook: () => void;
  onRelease: () => void;
  onRequestMaintenance: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-auto absolute left-8 top-1/2 z-20 w-[340px] -translate-y-1/2 rounded-[var(--radius-panel)] material-thick specular-edge p-6"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-title3 font-[620] text-ink-0">Manage board</h3>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 grid size-7 place-items-center rounded-full text-ink-400 hover:text-ink-0"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {board.status !== "booked" ? (
            <Button variant="primary" onClick={onBook}>
              Mark as booked
            </Button>
          ) : (
            /* Without this the lease never ends, the board stays booked for
               good, and the public site keeps telling clients it is taken. */
            <Button variant="primary" onClick={onRelease}>
              End the lease
            </Button>
          )}
          <Button onClick={onRequestMaintenance}>Request maintenance</Button>
        </div>

        {board.status === "booked" && board.rental && (
          <p className="mt-4 text-footnote text-ink-500">
            {board.rental.company} until {fullDate(board.rental.endDate)}. Ending
            the lease frees it on the public site straight away.
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
