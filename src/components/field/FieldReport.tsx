"use client";

import { useState } from "react";
import { Camera, Check, MapPin, X } from "lucide-react";
import type { Board } from "@/lib/types";
import type { Severity } from "@/lib/mockMaintenance";
import { cn } from "@/lib/utils";

const SEVERITIES: { id: Severity; label: string; help: string; color: string }[] = [
  { id: "red",    label: "Urgent",   help: "Fix today",        color: "var(--color-sev-red)" },
  { id: "orange", label: "Soon",     help: "This week",        color: "var(--color-sev-orange)" },
  { id: "yellow", label: "Not urgent", help: "When convenient", color: "var(--color-sev-yellow)" },
];

/**
 * Deliberately oversized controls and one decision per screenful. This is used
 * one-handed, outdoors, in sunlight, by someone who does not use apps much.
 */
export function FieldReport({ board }: { board: Board }) {
  const underMaintenance = board.status === "under_maintenance";

  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  function addPhoto(files: FileList | null) {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls].slice(0, 4));
  }

  const canSend = name.trim().length > 1 && (underMaintenance || severity !== null);

  if (sent) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col items-center justify-center gap-6 px-6 text-center">
        <span
          className="grid size-20 place-items-center rounded-full"
          style={{ background: "var(--color-available)" }}
        >
          <Check className="size-10 text-black" strokeWidth={3} />
        </span>
        <h1 className="text-title1 font-[680] text-ink-0">
          {underMaintenance ? "Marked as fixed" : "Sent to office"}
        </h1>
        <p className="text-body text-ink-300">
          {underMaintenance
            ? "Thank you. The office can see this board is repaired."
            : "The office has your report. You can close this page."}
        </p>
        <p className="font-mono text-footnote text-ink-500">{board.code}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-5 pb-10 pt-8">
      {/* which board you are standing at */}
      <div className="rounded-[var(--radius-panel)] bg-chrome-raised p-5 ring-1 ring-white/[0.07] ring-inset">
        <span className="font-mono text-footnote text-ink-500">{board.code}</span>
        <h1 className="mt-1 text-title2 font-[680] leading-tight text-ink-0">{board.name}</h1>
        <p className="mt-2 flex items-start gap-2 text-body text-ink-300">
          <MapPin className="mt-0.5 size-[18px] shrink-0 text-ink-500" strokeWidth={2} />
          {board.address}
        </p>
        {underMaintenance && (
          <p
            className="mt-4 rounded-[var(--radius-control)] px-4 py-3 text-subhead font-[590]"
            style={{
              color: "var(--color-maintenance)",
              background: "color-mix(in srgb, var(--color-maintenance) 15%, transparent)",
            }}
          >
            This board is marked under maintenance.
          </p>
        )}
      </div>

      <h2 className="mt-8 text-title3 font-[620] text-ink-0">
        {underMaintenance ? "Finished the repair?" : "What is the problem?"}
      </h2>

      {/* severity — only when raising, not when closing */}
      {!underMaintenance && (
        <div className="mt-4 flex flex-col gap-3">
          {SEVERITIES.map((s) => {
            const on = severity === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSeverity(s.id)}
                className={cn(
                  "flex h-[68px] w-full items-center gap-4 rounded-[var(--radius-card)] px-5 text-left transition-colors",
                  on ? "bg-white/[0.08]" : "bg-chrome-raised hover:bg-white/[0.05]",
                )}
                style={{
                  boxShadow: on
                    ? `inset 0 0 0 2px ${s.color}`
                    : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                <span
                  className="size-6 shrink-0 rounded-full"
                  style={{
                    background: s.color,
                    boxShadow: on ? `0 0 0 4px color-mix(in srgb, ${s.color} 35%, transparent)` : "none",
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-body font-[620] text-ink-0">{s.label}</span>
                  <span className="block text-footnote text-ink-400">{s.help}</span>
                </span>
                {on && <Check className="ml-auto size-5 shrink-0 text-ink-0" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}

      {/* photos */}
      <div className="mt-6">
        <label className="flex h-[68px] w-full cursor-pointer items-center justify-center gap-3 rounded-[var(--radius-card)] bg-chrome-raised text-body font-[590] text-ink-100 ring-1 ring-white/[0.1] ring-inset">
          <Camera className="size-6" strokeWidth={2} />
          {photos.length ? `Add another photo (${photos.length})` : "Take a photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => addPhoto(e.target.files)}
          />
        </label>

        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {photos.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-[var(--radius-control)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
                <button
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white"
                >
                  <X className="size-3.5" strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* optional note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Anything to add? (optional)"
        className="mt-4 w-full rounded-[var(--radius-card)] bg-chrome-raised p-4 text-body text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.1] ring-inset outline-none focus:ring-2 focus:ring-accent"
      />

      {/* who is reporting — replaces having an account */}
      <div className="mt-4">
        <label className="mb-2 block text-subhead text-ink-300">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          className="h-[60px] w-full rounded-[var(--radius-card)] bg-chrome-raised px-5 text-body text-ink-0 placeholder:text-ink-500 ring-1 ring-white/[0.1] ring-inset outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <button
        disabled={!canSend}
        onClick={() => setSent(true)}
        className={cn(
          "mt-6 h-[64px] w-full rounded-[var(--radius-card)] text-title3 font-[620] transition-colors",
          "disabled:opacity-35",
          "bg-accent text-accent-on",
        )}
      >
        {underMaintenance ? "Mark as fixed" : "Send to office"}
      </button>
    </main>
  );
}
