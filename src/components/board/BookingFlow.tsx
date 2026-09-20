"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import type { Board } from "@/lib/types";
import { inr, fullDate, parseDateOnly, cn } from "@/lib/utils";
import { Button, Card, Field, SectionHeader } from "@/components/ui/Primitives";
import { CompanyCombo, Label, Select, TextInput } from "@/components/ui/FormControls";

export type BookingDraft = {
  company: string;
  startDate: string;
  endDate: string;
  rate: string;
  printedBy: "" | "us" | "client";
  contactPerson: string;
  phone: string;
};

const EMPTY: BookingDraft = {
  company: "", startDate: "", endDate: "", rate: "",
  printedBy: "", contactPerson: "", phone: "",
};

function daysBetween(a: string, b: string) {
  if (!a || !b) return null;
  const d = Math.round(
    (parseDateOnly(b).getTime() - parseDateOnly(a).getTime()) / 86_400_000,
  ) + 1;
  return d > 0 ? d : null;
}

export function BookingFlow({
  board,
  companies,
  onCancel,
  onConfirm,
}: {
  board: Board;
  companies: string[];
  onCancel: () => void;
  onConfirm: (d: BookingDraft) => void;
}) {
  const [step, setStep] = useState<"form" | "review">("form");
  const [d, setD] = useState<BookingDraft>(EMPTY);

  const set = <K extends keyof BookingDraft>(k: K, v: BookingDraft[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const duration = daysBetween(d.startDate, d.endDate);
  const rateNum = Number(d.rate) || 0;

  // Live discount against the asking rate — the number that makes
  // "are we discounting more than we used to?" answerable later.
  const discount = useMemo(() => {
    if (!rateNum || !board.askingRate) return null;
    return Math.round(((board.askingRate - rateNum) / board.askingRate) * 1000) / 10;
  }, [rateNum, board.askingRate]);

  const datesValid = !d.startDate || !d.endDate || duration !== null;
  const canProceed =
    d.company.trim() && d.startDate && d.endDate && rateNum > 0 && d.printedBy && datesValid;

  return (
    <div className="flex h-full w-[427px] shrink-0 flex-col overflow-y-auto material-thick border-r border-white/[0.06]">
      {/* header */}
      <div className="flex items-start justify-between border-b border-white/[0.07] px-8 pb-6 pt-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {step === "review" && (
              <button
                onClick={() => setStep("form")}
                aria-label="Back"
                className="-ml-1 grid size-7 place-items-center rounded-full text-ink-400 hover:text-ink-0"
              >
                <ArrowLeft className="size-[18px]" strokeWidth={2.1} />
              </button>
            )}
            <h1 className="text-title2 font-[680] text-ink-0">
              {step === "form" ? "Booking" : "Review details"}
            </h1>
          </div>
          <p className="mt-2 truncate text-subhead text-ink-300">{board.address}</p>
          <p className="mt-1 text-footnote tabular-nums text-ink-500">
            {board.lat.toFixed(6)}, {board.lng.toFixed(6)}
          </p>
        </div>
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="grid size-8 shrink-0 place-items-center rounded-full material-inset text-ink-400 hover:text-ink-0"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-8 py-7">
        <SectionHeader>Booking details</SectionHeader>

        {step === "form" ? (
          <Card className="mt-4 flex flex-col gap-5">
            <div>
              <Label>Company name</Label>
              <CompanyCombo value={d.company} onChange={(v) => set("company", v)} companies={companies} />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
              <div className="min-w-0">
                <Label>Lease start</Label>
                <TextInput type="date" value={d.startDate} onChange={(v) => set("startDate", v)} />
              </div>
              <span className="pb-4 text-ink-500">–</span>
              <div className="min-w-0">
                <Label>Lease end</Label>
                <TextInput type="date" value={d.endDate} onChange={(v) => set("endDate", v)} />
              </div>
            </div>
            {d.startDate && d.endDate && (
              <p className={cn("-mt-3 text-footnote", duration ? "text-ink-400" : "")}
                 style={!duration ? { color: "var(--color-damaged)" } : undefined}>
                {duration ? `${duration} days` : "End date must be after the start date"}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rent amount</Label>
                <TextInput type="number" prefix="₹" value={d.rate} onChange={(v) => set("rate", v)} />
              </div>
              <div>
                <Label>Printer</Label>
                <Select
                  value={d.printedBy}
                  onChange={(v) => set("printedBy", v as BookingDraft["printedBy"])}
                  options={[
                    { value: "us", label: "DV Outdoor" },
                    { value: "client", label: "Client" },
                  ]}
                />
              </div>
            </div>

            {discount !== null && (
              <div className="-mt-2 flex items-center justify-between rounded-[var(--radius-control)] bg-black/25 px-4 py-3">
                <span className="text-footnote text-ink-400">
                  Asking {inr(board.askingRate)}
                </span>
                <span
                  className="text-footnote font-[590] tabular-nums"
                  style={{
                    color:
                      discount > 20 ? "var(--color-damaged)"
                      : discount > 0 ? "var(--color-maintenance)"
                      : "var(--color-available)",
                  }}
                >
                  {discount > 0 ? `${discount}% below asking` : discount < 0 ? `${-discount}% above asking` : "At asking"}
                </span>
              </div>
            )}

            <div>
              <Label>Person to contact</Label>
              <TextInput value={d.contactPerson} onChange={(v) => set("contactPerson", v)} placeholder="Optional" />
            </div>
            <div>
              <Label>Phone number</Label>
              <TextInput value={d.phone} onChange={(v) => set("phone", v)} placeholder="Optional" />
            </div>
          </Card>
        ) : (
          <Card className="mt-4 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company">{d.company}</Field>
              <Field label="Printer">{d.printedBy === "us" ? "DV Outdoor" : "Client"}</Field>
            </div>
            <div>
              <div className="text-footnote text-ink-400">Lease period</div>
              <div className="mt-1 text-body font-[590] tabular-nums text-ink-0">
                {fullDate(d.startDate)} — {fullDate(d.endDate)}
              </div>
              <div className="mt-1 text-footnote tabular-nums text-ink-500">{duration} days</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rent" accent="money">{inr(rateNum)}</Field>
              <Field label="vs asking">
                <span
                  className="tabular-nums"
                  style={{
                    color:
                      (discount ?? 0) > 20 ? "var(--color-damaged)"
                      : (discount ?? 0) > 0 ? "var(--color-maintenance)"
                      : "var(--color-available)",
                  }}
                >
                  {discount === 0 ? "At asking" : `${Math.abs(discount ?? 0)}% ${(discount ?? 0) > 0 ? "below" : "above"}`}
                </span>
              </Field>
            </div>
            {(d.contactPerson || d.phone) && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Person to contact">{d.contactPerson || "—"}</Field>
                <Field label="Phone">{d.phone || "—"}</Field>
              </div>
            )}

          </Card>
        )}
      </div>

      <motion.div layout className="sticky bottom-0 mt-auto border-t border-white/[0.07] material-thick px-8 py-5">
        {step === "form" ? (
          <Button variant="primary" disabled={!canProceed} onClick={() => setStep("review")}>
            Proceed
          </Button>
        ) : (
          <Button variant="primary" onClick={() => onConfirm(d)}>
            Confirm booking
          </Button>
        )}
      </motion.div>
    </div>
  );
}
