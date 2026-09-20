import { redirect, notFound } from "next/navigation";
import { BOARDS } from "@/lib/mockBoards";
import { getProfile } from "@/lib/supabase/server";
import { FieldReport } from "@/components/field/FieldReport";

/**
 * The QR on every board points here. If the agent already has a session — and
 * after accepting their invite once, they do — the scan lands straight on this
 * board's report form with their name already attached. No login screen, no
 * typing their name, no choosing from a list of 650. If they have no session,
 * they get bounced to sign in and returned here afterwards.
 */
export default async function FieldBoardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const board = BOARDS.find((b) => b.code.toLowerCase() === code.toLowerCase());
  if (!board) notFound();

  const profile = await getProfile();
  if (!profile || profile.status !== "approved") {
    redirect(`/login?next=${encodeURIComponent(`/field/${board.code}`)}`);
  }

  return <FieldReport board={board} agentName={profile.full_name ?? profile.email} />;
}
