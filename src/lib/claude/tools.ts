import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const BOARD_STATUSES = [
  "available",
  "booked",
  "under_maintenance",
  "damaged",
  "pending_installation",
] as const;

const BOARD_TYPES = [
  "unipole",
  "hoarding",
  "gantry",
  "led_screen",
  "wall_wrap",
  "bus_shelter",
  "other",
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveBoardId(
  supabase: SupabaseClient<Database>,
  codeOrId: string,
): Promise<string | null> {
  if (UUID_RE.test(codeOrId)) {
    const { data } = await supabase.from("boards").select("id").eq("id", codeOrId).maybeSingle();
    if (data) return data.id;
  }
  const { data } = await supabase.from("boards").select("id").eq("code", codeOrId).maybeSingle();
  return data?.id ?? null;
}

/**
 * Read/write tools for the admin chatbot. Every write goes through the same
 * record_board_status_update() RPC that field agents use (see
 * supabase/migrations/0001_init.sql) — there is no separate, less-audited
 * write path for the chatbot. Reads run through the caller's own
 * cookie-scoped Supabase client, so RLS (not the tool schema) is the real
 * security boundary.
 */
export function createBoardTools(supabase: SupabaseClient<Database>) {
  const searchBoards = betaZodTool({
    name: "search_boards",
    description:
      "Search the board inventory. All filters are optional and combine with AND. Use this to answer questions about which boards match some criteria, or to find a board before updating it. Returns at most 50 boards, with the true total count.",
    inputSchema: z.object({
      query: z.string().optional().describe("Free-text match against board code or name"),
      city: z.string().optional(),
      status: z.enum(BOARD_STATUSES).optional(),
      board_type: z.enum(BOARD_TYPES).optional(),
      permit_due_within_days: z
        .number()
        .int()
        .optional()
        .describe(
          "Only boards whose permit_expiry_date falls within this many days from today (including already-expired permits)",
        ),
    }),
    run: async (input) => {
      let q = supabase.from("boards").select("*");
      if (input.city) q = q.eq("city", input.city);
      if (input.status) q = q.eq("status", input.status);
      if (input.board_type) q = q.eq("board_type", input.board_type);

      const { data, error } = await q;
      if (error) return JSON.stringify({ error: error.message });

      let results = data ?? [];
      if (input.query) {
        const needle = input.query.toLowerCase();
        results = results.filter(
          (b) => b.code.toLowerCase().includes(needle) || b.name.toLowerCase().includes(needle),
        );
      }
      if (input.permit_due_within_days != null) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + input.permit_due_within_days);
        results = results.filter(
          (b) => b.permit_expiry_date && new Date(b.permit_expiry_date) <= cutoff,
        );
      }

      return JSON.stringify({
        total: results.length,
        returned: Math.min(results.length, 50),
        boards: results.slice(0, 50),
      });
    },
  });

  const getBoard = betaZodTool({
    name: "get_board",
    description:
      "Get full details for one board by its code (e.g. 'AHD-SG-014') or id, including its recent status history. Call this before update_board_status if you don't already know the board's current status.",
    inputSchema: z.object({ board_code_or_id: z.string() }),
    run: async (input) => {
      const boardId = await resolveBoardId(supabase, input.board_code_or_id);
      if (!boardId) {
        return JSON.stringify({ error: `No board found matching "${input.board_code_or_id}"` });
      }

      const [{ data: board }, { data: history }] = await Promise.all([
        supabase.from("boards").select("*").eq("id", boardId).maybeSingle(),
        supabase
          .from("board_status_history")
          .select("*")
          .eq("board_id", boardId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      return JSON.stringify({ board, recent_history: history ?? [] });
    },
  });

  const getDashboardStats = betaZodTool({
    name: "get_dashboard_stats",
    description:
      "Get aggregate counts across the whole board inventory: totals by status, by city, and how many permits are due for renewal soon.",
    inputSchema: z.object({
      permit_window_days: z
        .number()
        .int()
        .optional()
        .describe("Window in days to count permits as 'due soon'; defaults to 30"),
    }),
    run: async (input) => {
      const { data, error } = await supabase.from("boards").select("status, city, permit_expiry_date");
      if (error) return JSON.stringify({ error: error.message });

      const windowDays = input.permit_window_days ?? 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + windowDays);

      const byStatus: Record<string, number> = {};
      const byCity: Record<string, number> = {};
      let permitsDue = 0;

      for (const b of data ?? []) {
        byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
        byCity[b.city] = (byCity[b.city] ?? 0) + 1;
        if (b.permit_expiry_date && new Date(b.permit_expiry_date) <= cutoff) permitsDue++;
      }

      return JSON.stringify({
        total: data?.length ?? 0,
        by_status: byStatus,
        by_city: byCity,
        permits_due_within_days: windowDays,
        permits_due_count: permitsDue,
      });
    },
  });

  const updateBoardStatus = betaZodTool({
    name: "update_board_status",
    description:
      "Update a board's status and/or note. This is the ONLY way to change a board's status — always call get_board first if you don't already know the board's current status, since leaving the status unchanged still requires passing its current value back. Every call is logged to the board's status history, so write a clear note when the admin gives a reason for the change. Note: this does not create or end a rental — that's a separate flow.",
    inputSchema: z.object({
      board_code_or_id: z.string(),
      new_status: z.enum(BOARD_STATUSES),
      note: z.string().optional(),
    }),
    run: async (input) => {
      const boardId = await resolveBoardId(supabase, input.board_code_or_id);
      if (!boardId) {
        return JSON.stringify({ error: `No board found matching "${input.board_code_or_id}"` });
      }

      const { error } = await supabase.rpc("record_board_status_update", {
        p_board_id: boardId,
        p_new_status: input.new_status,
        p_note: input.note ?? null,
      });

      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, board_id: boardId, new_status: input.new_status });
    },
  });

  return [searchBoards, getBoard, getDashboardStats, updateBoardStatus];
}
