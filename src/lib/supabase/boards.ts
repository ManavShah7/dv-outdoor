import { createClient } from "@/lib/supabase/server";
import type { Board, BoardPhoto, BoardStatusHistoryEntry } from "@/lib/types/database";

export async function getBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("boards").select("*").order("city").order("code");
  if (error) throw error;
  return data ?? [];
}

export async function getBoardById(id: string): Promise<Board | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("boards").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBoardListingPhoto(boardId: string): Promise<BoardPhoto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("board_photos")
    .select("*")
    .eq("board_id", boardId)
    .eq("category", "listing")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBoardHistory(boardId: string): Promise<BoardStatusHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("board_status_history")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
