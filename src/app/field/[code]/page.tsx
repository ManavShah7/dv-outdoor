import { notFound } from "next/navigation";
import { BOARDS } from "@/lib/mockBoards";
import { FieldReport } from "@/components/field/FieldReport";

/**
 * The QR on every board points here. Scanning opens this board and nothing
 * else — no login, no account, no list of 650 to choose from. The crew are
 * not tech-comfortable, so the scan itself is the authentication and the
 * navigation.
 */
export default async function FieldBoardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const board = BOARDS.find((b) => b.code.toLowerCase() === code.toLowerCase());
  if (!board) notFound();

  return <FieldReport board={board} />;
}
