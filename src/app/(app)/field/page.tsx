import { Navigation } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function FieldPage() {
  return (
    <ComingSoon
      icon={Navigation}
      title="Field mode"
      description="The QR-scan field portal for maintenance reports — not built yet."
    />
  );
}
