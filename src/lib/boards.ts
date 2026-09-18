import type { BoardStatus, BoardType } from "@/lib/types/database";

export const STATUS_META: Record<BoardStatus, { label: string; color: string }> = {
  available: { label: "Available", color: "var(--status-available)" },
  booked: { label: "Booked", color: "var(--status-booked)" },
  under_maintenance: { label: "Under maintenance", color: "var(--status-maintenance)" },
  damaged: { label: "Damaged", color: "var(--status-damaged)" },
  pending_installation: { label: "Pending installation", color: "var(--status-pending)" },
};

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  unipole: "Unipole",
  hoarding: "Hoarding",
  gantry: "Gantry",
  led_screen: "LED screen",
  wall_wrap: "Wall wrap",
  bus_shelter: "Bus shelter",
  other: "Other",
};

/** A permit counts as "due" inside this window so ops can plan renewals ahead of time. */
export const PERMIT_RENEWAL_WINDOW_DAYS = 30;
