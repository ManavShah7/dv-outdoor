"use client";

import { ThumbsUp, ThumbsDown, ArrowLeft, TriangleAlert } from "lucide-react";
import type { Board } from "@/lib/types";
import { SEV } from "@/components/maintenance/MaintenanceView";
import type { MaintenanceRequest, Severity } from "@/lib/mockMaintenance";
import { cn, inr } from "@/lib/utils";
import { Button, Card, Field, SectionHeader } from "@/components/ui/Primitives";

function timeAgo(iso: string) {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function SeverityChip({ s, small }: { s: Severity; small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] font-[620]",
        small ? "px-2 py-0.5 text-caption" : "px-2.5 py-1 text-footnote",
      )}
      style={{ color: SEV[s].color, background: `color-mix(in srgb, ${SEV[s].color} 16%, transparent)` }}
    >
      <span className="size-[6px] rounded-full" style={{ background: SEV[s].color }} />
      {SEV[s].label}
    </span>
  );
}

/* ----------------------------------------------------------------- detail */
export function MaintenanceDetail({
  request,
  board,
  onBack,
  onFeedback,
  onStartWork,
}: {
  request: MaintenanceRequest;
  board: Board | undefined;
  onBack: () => void;
  onFeedback: (v: "up" | "down") => void;
  onStartWork: () => void;
}) {
  const disagrees = request.aiSeverity !== request.reporterSeverity;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto material-thick">
      <div className="flex items-start gap-2 border-b border-white/[0.07] px-8 pb-6 pt-8">
        <button
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-ink-400 hover:text-ink-0"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.1} />
        </button>
        <div className="min-w-0">
          <h1 className="text-title2 font-[680] text-ink-0">{board?.name ?? "Board"}</h1>
          <p className="mt-2 truncate text-subhead text-ink-300">{board?.address}</p>
        </div>
      </div>

      {/* what the field crew sent */}
      <section className="border-b border-white/[0.07] px-8 py-7">
        <SectionHeader>Reported</SectionHeader>
        <Card className="mt-4 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="By">{request.reportedByName}</Field>
            <Field label="When">{timeAgo(request.reportedAt)}</Field>
          </div>
          <div>
            <div className="text-footnote text-ink-400">Description</div>
            <p className="mt-1 text-body text-ink-0">{request.description}</p>
          </div>
          <div>
            <div className="text-footnote text-ink-400">Crew severity</div>
            <div className="mt-1.5"><SeverityChip s={request.reporterSeverity} /></div>
          </div>
        </Card>
      </section>

      {/* the triage */}
      <section className="border-b border-white/[0.07] px-8 py-7">
        <SectionHeader>Assessment</SectionHeader>
        <Card className="mt-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-footnote text-ink-400">Severity</div>
              <div className="mt-1.5 flex items-center gap-2">
                <SeverityChip s={request.aiSeverity} />
                {disagrees && (
                  <span className="text-caption text-ink-500">
                    was {SEV[request.reporterSeverity].label.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-footnote text-ink-400">Urgency</div>
              <div
                className="text-title2 font-[680] tabular-nums"
                style={{ color: SEV[request.aiSeverity].color }}
              >
                {request.aiUrgencyScore}
              </div>
            </div>
          </div>

          <div>
            <div className="text-footnote text-ink-400">Reasoning</div>
            <p className="mt-1 text-subhead leading-relaxed text-ink-100">{request.aiReasoning}</p>
          </div>

          {request.wasRentedAtReport && (
            <div className="flex items-center gap-2.5 rounded-[var(--radius-control)] bg-black/25 px-4 py-3">
              <TriangleAlert className="size-4 shrink-0" style={{ color: SEV[request.aiSeverity].color }} />
              <span className="text-footnote text-ink-200">
                <span className="font-[620] tabular-nums">{inr(request.revenueAtRisk)}</span> of paid
                exposure at risk per day
              </span>
            </div>
          )}

          {/* the feedback signal that tunes future triage prompts */}
          <div>
            <div className="text-footnote text-ink-400">Was this right?</div>
            <div className="mt-2.5 flex gap-2">
              {(["up", "down"] as const).map((v) => {
                const on = request.adminFeedback === v;
                const Icon = v === "up" ? ThumbsUp : ThumbsDown;
                return (
                  <button
                    key={v}
                    onClick={() => onFeedback(v)}
                    className={cn(
                      "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)]",
                      "text-footnote font-[590] ring-1 ring-inset transition-colors",
                      on
                        ? "bg-accent text-accent-on ring-transparent"
                        : "bg-black/25 text-ink-300 ring-white/[0.08] hover:text-ink-0",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                    {v === "up" ? "Correct" : "Off"}
                  </button>
                );
              })}
            </div>
            {request.adminFeedback && (
              <p className="mt-2 text-caption text-ink-500">Saved.</p>
            )}
          </div>
        </Card>
      </section>

      <div className="sticky bottom-0 mt-auto border-t border-white/[0.07] material-thick px-8 py-5">
        {request.status === "in_progress" ? (
          <p className="text-center text-footnote text-ink-500">
            Already under maintenance. The crew closes it from the field.
          </p>
        ) : (
          <Button variant="primary" onClick={onStartWork}>
            Set under maintenance
          </Button>
        )}
      </div>
    </div>
  );
}
