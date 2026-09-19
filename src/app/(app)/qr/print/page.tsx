import { QrCode } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function QrPrintPage() {
  return (
    <ComingSoon
      icon={QrCode}
      title="QR stickers"
      description="Bulk QR sticker sheet generation for printing — not built yet."
    />
  );
}
