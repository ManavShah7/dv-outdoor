import "./editorial.css";
import { text } from "@/components/times/fonts";
import { getPublicBoards } from "@/lib/boards.db";
import { Landing, EdFoot } from "@/components/times/editorial";
import { EdContact } from "@/components/times/EdContact";

export const metadata = {
  title: "The Times Media — billboards across Saurashtra",
  description:
    "600+ billboards across Saurashtra, ours, maintained by us and rented directly to you. See every site on the map, in Street View, before you commit.",
};

/** Read fresh: the photographed sites and their codes come from the same
 *  inventory the office edits. */
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { boards } = await getPublicBoards();
  return (
    <div className={`ed ${text.variable}`}>
      <Landing boards={boards} />
      <EdContact />
      <EdFoot />
    </div>
  );
}
