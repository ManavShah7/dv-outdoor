import type { Board } from "./types";
import { BOARDS } from "./mockBoards";
import { boardPhotoUrl, VOICE_SAMPLE_URL } from "./assets";

export type Severity = "red" | "orange" | "yellow";

export type MaintenanceRequest = {
  id: string;
  boardId: string;
  reportedByName: string;
  reportedAt: string;
  description: string;
  /** what the field crew picked on their phone */
  reporterSeverity: Severity;
  /** what the model concluded after reading the photo, text and board state */
  aiSeverity: Severity;
  aiUrgencyScore: number;
  aiReasoning: string;
  revenueAtRisk: number;
  wasRentedAtReport: boolean;
  status: "open" | "in_progress" | "resolved";
  adminFeedback?: "up" | "down";
  /** what the crew attached at the board */
  photos: string[];
  voiceNote: { url: string; seconds: number; language: string } | null;
};

const REPORTERS = ["Jignesh Vala", "Ramesh Solanki", "Dinesh Chavda", "Suresh Makwana", "Imran Shaikh"];

const FAULTS = [
  { text: "Flex is torn on the left side, flapping in the wind",        base: "orange" as Severity },
  { text: "Two tube lights not working, board is dark at night",        base: "orange" as Severity },
  { text: "Frame is bent near the bottom bracket",                      base: "red" as Severity },
  { text: "Banner has come loose at the top corner",                    base: "orange" as Severity },
  { text: "Rust on the supporting pole, looks weak",                    base: "red" as Severity },
  { text: "Small water stain on the print, barely visible",             base: "yellow" as Severity },
  { text: "Graffiti sprayed across the lower half",                     base: "orange" as Severity },
  { text: "Whole panel has fallen partially, hanging over footpath",    base: "red" as Severity },
  { text: "Paint peeling on the frame edge",                            base: "yellow" as Severity },
  { text: "Light flickering intermittently after 9pm",                  base: "yellow" as Severity },
  { text: "Print faded badly from sun exposure",                        base: "yellow" as Severity },
  { text: "Bolts missing on the right mounting plate",                  base: "red" as Severity },
];

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const ORDER: Record<Severity, number> = { yellow: 0, orange: 1, red: 2 };
const FROM_ORDER: Severity[] = ["yellow", "orange", "red"];
/** Prose labels — the raw enum should never reach the reasoning text. */
const SEV_WORD: Record<Severity, string> = { red: "high urgency", orange: "urgent", yellow: "low priority" };

function monthlyRate(b: Board) {
  return b.rental?.rate ?? b.askingRate;
}

/**
 * Stands in for the real triage call. The logic mirrors what the live model
 * will be told to weigh: the crew's own severity, the fault described, and —
 * the part the crew cannot know — whether the board is currently earning.
 * A damaged board under contract is money leaking every day; an identical
 * vacant one is a maintenance ticket.
 */
function triage(board: Board, faultBase: Severity, reporter: Severity) {
  const rented = board.status === "booked" || !!board.rental;
  const rate = monthlyRate(board);
  const perDay = Math.round(rate / 30);

  let score = { yellow: 28, orange: 55, red: 82 }[faultBase];
  if (rented) score += 14;
  if (rate > 70000) score += 6;
  if (reporter === "red") score += 5;
  if (reporter === "yellow") score -= 5;
  score = Math.max(8, Math.min(98, score));

  const aiSeverity: Severity = score >= 72 ? "red" : score >= 45 ? "orange" : "yellow";

  const bits: string[] = [];
  if (rented) {
    bits.push(
      `Board is live under contract with ${board.rental?.company ?? "a client"} at ${
        "₹" + rate.toLocaleString("en-IN")
      }/month — roughly ₹${perDay.toLocaleString("en-IN")} of paid exposure at risk each day it stays faulty.`,
    );
  } else {
    bits.push("Board is currently vacant, so no client exposure is being lost while it waits.");
  }

  if (faultBase === "red") {
    bits.push("The reported fault is structural, which carries a public-safety exposure beyond the lost impressions.");
  } else if (faultBase === "orange") {
    bits.push("The fault is cosmetic-to-functional: the board still stands but is not delivering what was sold.");
  } else {
    bits.push("The fault is cosmetic and slow-moving; deferring it to the next scheduled visit is reasonable.");
  }

  if (ORDER[aiSeverity] > ORDER[reporter]) {
    bits.push(`Raised above the "${SEV_WORD[reporter]}" the crew selected, because they could not see the rental status from the field.`);
  } else if (ORDER[aiSeverity] < ORDER[reporter]) {
    bits.push(`Lowered from the "${SEV_WORD[reporter]}" the crew selected — the damage is real but nothing is being lost against it right now.`);
  } else {
    bits.push(`Matches the "${SEV_WORD[reporter]}" the crew selected.`);
  }

  return { aiSeverity, score, reasoning: bits.join(" ") };
}

export function generateMaintenance(): MaintenanceRequest[] {
  const r = rng(77216);
  const candidates = BOARDS.filter(
    (b) => b.status === "damaged" || b.status === "under_maintenance",
  ).slice(0, 26);

  // Deal faults from a shuffled deck so the queue does not read as the same
  // sentence repeated. Reshuffles when exhausted.
  let deck: typeof FAULTS = [];
  const nextFault = () => {
    if (deck.length === 0) {
      deck = [...FAULTS].sort(() => r() - 0.5);
    }
    return deck.pop()!;
  };

  return candidates.map((b, i) => {
    const fault = nextFault();
    // crews under-report as often as they over-report
    const drift = r();
    const reporterSeverity: Severity =
      drift < 0.22 ? FROM_ORDER[Math.max(0, ORDER[fault.base] - 1)]
      : drift > 0.84 ? FROM_ORDER[Math.min(2, ORDER[fault.base] + 1)]
      : fault.base;

    const { aiSeverity, score, reasoning } = triage(b, fault.base, reporterSeverity);
    const hoursAgo = Math.floor(r() * 96) + 1;

    return {
      id: `m${i + 1}`,
      boardId: b.id,
      reportedByName: REPORTERS[Math.floor(r() * REPORTERS.length)],
      reportedAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
      description: fault.text,
      reporterSeverity,
      aiSeverity,
      aiUrgencyScore: score,
      aiReasoning: reasoning,
      revenueAtRisk: b.rental ? Math.round(monthlyRate(b) / 30) : 0,
      wasRentedAtReport: !!b.rental,
      status: b.status === "under_maintenance" ? "in_progress" : "open",
      // the crew photograph the fault; roughly half also leave a spoken note
      photos: [boardPhotoUrl(`JUN-${String((i % 26) + 1).padStart(3, "0")}`)],
      voiceNote:
        r() < 0.55
          ? { url: VOICE_SAMPLE_URL(), seconds: 8 + Math.floor(r() * 22), language: "Gujarati" }
          : null,
    };
  });
}

export const MAINTENANCE = generateMaintenance();
