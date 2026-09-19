import { Upload } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function ImportPage() {
  return (
    <ComingSoon
      icon={Upload}
      title="Import"
      description="Bulk spreadsheet import for your existing board inventory — not built yet."
    />
  );
}
