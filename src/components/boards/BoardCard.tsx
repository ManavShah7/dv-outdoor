"use client";

import type { Board } from "@/lib/types";
import { inr, fullDate } from "@/lib/utils";
import { statusMeta } from "@/components/ui/Primitives";

function lightingLabel(l: Board["lighting"]) {
  return l === "backlit" ? "Back-Lit" : l === "frontlit" ? "Front-Lit" : "Non-Lit";
}

/** One card, used by the Boards grid and by search results, so a board looks
 *  the same wherever it is listed. */
export function BoardCard({ board, onOpen }: { board: Board; onOpen: () => void }) {
  const m = statusMeta(board.status);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-chrome-raised ring-1 ring-white/[0.07] ring-inset">
      {/* Status edge rather than an empty photo well — boards have no images
          yet, and a 16:10 placeholder made the card 40% dead space. */}
      <div className="h-1 w-full shrink-0" style={{ background: m.color }} />
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <span className="font-mono text-caption tabular-nums text-ink-400">{board.code}</span>
        <span className="text-caption font-[620] tabular-nums text-ink-100">
          {inr(board.askingRate)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-subhead font-[590] text-ink-0">{board.name}</h3>
        <p className="mt-0.5 truncate text-footnote text-ink-400">{board.address}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote">
          <span className="inline-flex items-center gap-1.5 font-[590]" style={{ color: m.color }}>
            <span className="size-[6px] rounded-full" style={{ background: m.color }} />
            {m.label}
          </span>
          <span className="text-ink-400">
            <span className="capitalize">{board.sizeCategory}</span> ({board.widthFt}*{board.heightFt})
          </span>
          <span className="text-ink-400">{lightingLabel(board.lighting)}</span>
        </div>

        {board.rental ? (
          <p className="mt-2 truncate text-footnote text-ink-300">
            {board.rental.company}
            <span className="text-ink-500"> · to {fullDate(board.rental.endDate)}</span>
          </p>
        ) : board.availableSince ? (
          <p className="mt-2 text-footnote text-ink-500">
            Free since {fullDate(board.availableSince)}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <button
            onClick={onOpen}
            className="h-10 w-full rounded-[var(--radius-control)] text-footnote font-[590] text-ink-100 ring-1 ring-white/[0.12] ring-inset transition-colors hover:bg-white/[0.07] hover:text-ink-0"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}
